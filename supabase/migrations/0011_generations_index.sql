-- Speed up the generation-history query (user_id + created_at sort).
-- Without this index Postgres does a full table scan + sort on every request.
create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);