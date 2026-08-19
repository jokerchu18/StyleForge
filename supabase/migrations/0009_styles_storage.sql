-- Move style preview images from the static /public directory to a public
-- Supabase Storage bucket. The `styles` bucket is PUBLIC (preview images are
-- publicly visible content, like the old /styles/api/*.png files); user
-- generation outputs stay in the private `generations` bucket.

insert into storage.buckets (id, name, public)
values ('styles', 'styles', true)
on conflict (id) do nothing;

-- Public read on the styles bucket (anyone can view preview images).
create policy "public read styles bucket"
  on storage.objects for select
  using (bucket_id = 'styles');

-- Rewrite preview_image from the static path (/styles/api/foo.png) to the
-- storage object path (styles/foo.png). The server resolves object paths into
-- public URLs (see api/_shared/styleCatalog.ts).
update public.styles
set preview_image = 'styles/' || regexp_replace(preview_image, '^/styles/api/', '')
where preview_image like '/styles/api/%';
