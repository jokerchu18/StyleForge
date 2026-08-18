// Canonical category list. The authoritative style data now lives in the
// Supabase `styles` table (see supabase/migrations/0004_styles.sql); this
// module only keeps the shared category display order.
import type { StyleCategory } from './style-types.js';

/** Category display order (also used as the canonical category list). */
export const CATEGORY_PRESETS: StyleCategory[] = [
  'anime',
  'painting',
  'sketch',
  'photo',
];
