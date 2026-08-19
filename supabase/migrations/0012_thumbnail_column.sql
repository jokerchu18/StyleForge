-- Store a lightweight WebP thumbnail alongside the full-size output.
-- The thumbnail is 400px wide, used by My Creations and any gallery view.

alter table public.generations
  add column if not exists thumbnail_image text;