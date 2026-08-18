import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react'

// Serve the Vercel Functions in api/*.ts during dev, using Vite's SSR loader
// to compile the TS on the fly. Handlers use the bare Node signature
// (req, res) => Promise<void> so they work here and on Vercel unchanged.
// Env vars are loaded straight from .env / .env.local and re-read on every
// /api request, so editing the env file (e.g. REPLICATE_MODELS) takes effect
// immediately without restarting the dev server. We parse the files directly
// instead of Vite's loadEnv() because loadEnv() with an empty prefix reads
// process.env back in, which would freeze process.env at its first value.
function serveApi(): Plugin {
  return {
    name: 'serve-api-functions',
    configureServer(server) {
      const reloadEnv = () => {
        const parsed: Record<string, string> = {};
        for (const file of ['.env', '.env.local']) {
          const abs = resolve(process.cwd(), file);
          try {
            Object.assign(parsed, parseEnv(readFileSync(abs, 'utf8')));
          } catch {
            // Missing or unreadable env file — just skip it.
          }
        }
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined) process.env[k] = v;
        }
      };
      server.middlewares.use('/api/', async (req, res, next) => {
        reloadEnv();
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
  plugins: [react(), serveApi()],
  server: {
    // Default 5173 sits inside a Windows-reserved TCP exclusion range
    // (5087-5186, typically claimed by Hyper-V/WSL/NAT), which makes the
    // bind fail with EACCES. 5190 is clear of every exclusion block.
    port: 5190,
  },
})
