-- Update the category system to: Trending, Character, Worlds, Creative.
-- The category list itself lives in the frontend (src/shared/styles-catalog.ts
-- CATEGORY_PRESETS) and is the display-order source of truth; `styles.category`
-- is an open-ended text column, so no separate categories table is needed.
--
-- This migration only clears the OLD styles (which used the retired
-- Editorial/Cinematic/Vintage/Street/Luxury categories). Concrete styles are
-- added by later migrations as their prompts + preview images are ready.

truncate table public.styles cascade;
