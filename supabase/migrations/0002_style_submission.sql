-- Community style submission: add model + optional seed, and the sample-image
-- storage bucket. Incremental on top of 0001 (run after it).

-- user_styles: add the Replicate model and optional seed. Existing rows (if any)
-- get an empty-string model default so the NOT NULL constraint can be added.
alter table public.user_styles
  add column if not exists model text not null default '',
  add column if not exists seed integer;

-- Sample-image storage bucket (public read, authenticated upload).
insert into storage.buckets (id, name, public)
values ('style-samples', 'style-samples', true)
on conflict (id) do nothing;

-- Anyone can view sample images (they are shown in the catalog).
create policy "public read style samples" on storage.objects
  for select using (bucket_id = 'style-samples');

-- Signed-in users can upload their own sample images.
create policy "users upload style samples" on storage.objects
  for insert with check (bucket_id = 'style-samples' and auth.role() = 'authenticated');
