import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadEnv, defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react'

// onnxruntime-web loads its WASM loaders at runtime via dynamic
// `import('/ort/xxx.mjs?import')`. Vite rejects `?import` requests for files
// inside /public (it treats them as "copied as-is, not importable"). Serve the
// .mjs loaders directly from public/ort so the model can load in dev.
function serveOrtLoaders(): Plugin {
  return {
    name: 'serve-ort-loaders',
    configureServer(server) {
      server.middlewares.use('/ort/', (req, res, next) => {
        const urlPath = (req.url ?? '').split('?')[0];
        if (!urlPath.endsWith('.mjs')) return next();
        const file = join(process.cwd(), 'public', 'ort', urlPath);
        try {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
          res.end(readFileSync(file));
        } catch {
          next();
        }
      });
    },
  };
}

// Serve the Vercel Functions in api/*.ts during dev, using Vite's SSR loader
// to compile the TS on the fly. Handlers use the bare Node signature
// (req, res) => Promise<void> so they work here and on Vercel unchanged.
// Env vars are loaded from .env.local (no VITE_ prefix filter).
function serveApi(): Plugin {
  return {
    name: 'serve-api-functions',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '');
      for (const [k, v] of Object.entries(env)) {
        if (v !== undefined && process.env[k] === undefined) process.env[k] = v;
      }
      server.middlewares.use('/api/', async (req, res, next) => {
        const pathPart = (req.url ?? '').split('?')[0].split('/')[1] ?? '';
        if (!/^[\w-]+$/.test(pathPart)) return next();
        const abs = resolve(process.cwd(), 'api', `${pathPart}.ts`);
        try {
          const mod = await server.ssrLoadModule(abs);
          const handler = mod.default;
          if (typeof handler !== 'function') return next();
          handler(req, res);
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveOrtLoaders(), serveApi()],
})
