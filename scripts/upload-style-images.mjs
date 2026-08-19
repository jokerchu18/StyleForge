// One-off upload: push local style preview images (public/styles/api/*) into
// the public Supabase Storage "styles" bucket, so they no longer need to ship
// with the codebase.
//
//   node scripts/upload-style-images.mjs
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local. Run AFTER the
// 0009_styles_storage.sql migration (which creates the bucket + rewrites
// preview_image to the "styles/<file>" object path).
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

const env = loadEnv(resolve(process.cwd(), '.env.local'));
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const DIR = resolve(process.cwd(), 'public', 'styles', 'api');
const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function loadEnv(path) {
  const map = {};
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) map[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // No env file — the caller will surface the missing-key error.
  }
  return map;
}

async function main() {
  const files = readdirSync(DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  let uploaded = 0;

  for (const file of files) {
    const bytes = readFileSync(join(DIR, file));
    const ext = extname(file).toLowerCase();
    const contentType = MIME[ext] ?? 'image/png';
    // `from('styles')` already scopes to the bucket; the object path is just
    // the filename. DB stores `styles/<file>`, resolved to the public URL by
    // api/_shared/styleCatalog.ts.
    const objectPath = file;

    const { error } = await supabase.storage
      .from('styles')
      .upload(objectPath, bytes, { contentType, upsert: true });

    if (error) {
      console.error(`✗ ${file}: ${error.message}`);
    } else {
      uploaded++;
      console.log(`✓ styles/${objectPath}`);
    }
  }

  console.log(`\nUploaded ${uploaded}/${files.length} images to the "styles" bucket.`);
}

main();
