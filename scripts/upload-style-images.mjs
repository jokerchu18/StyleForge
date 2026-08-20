// Upload local style preview images to Supabase Storage "styles" bucket.
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
//
// Usage: node scripts/upload-style-images.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';

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
  const env = loadEnv(resolve(process.cwd(), '.env.local'));
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Only upload the three new styles (old ones are already in Storage).
const files = ['sticker-art.png', 'ink-illustration.png', 'lego-world.png'];
  let uploaded = 0;

  for (const file of files) {
    const bytes = readFileSync(resolve(DIR, file));
    const ext = extname(file).toLowerCase();
    const contentType = MIME[ext] ?? 'image/png';

    const { error } = await supabase.storage
      .from('styles')
      .upload(file, bytes, { contentType, upsert: true });

    if (error) {
      console.error(`✗ ${file}: ${error.message}`);
    } else {
      uploaded++;
      console.log(`✓ ${file}`);
    }
  }

  console.log(`\nUploaded ${uploaded}/${files.length} images to "styles" bucket.`);
}

main();