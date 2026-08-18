-- Generated-image storage bucket (PRIVATE: only the server uploads/reads).
-- Generation images are user-private assets; clients get URLs server-side.

insert into storage.buckets (id, name, public)
values ('generations', 'generations', false)
on conflict (id) do nothing;

-- No client-facing storage policies: the service_role (bypassing RLS) is the
-- only writer. Download URLs are returned by /api/generations per-user.
