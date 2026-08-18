-- Style catalog moves into the database. The public `styles` table holds BOTH
-- the official styles (seeded below from the old static catalog) and approved
-- community styles. Private columns (prompt / negative_prompt / model /
-- generation_config) are NEVER readable by clients: the table has no SELECT
-- policy, so anon/authenticated users cannot query it directly — all public
-- reads go through GET /api/styles (service_role + prompt-stripping).

-- ── Styles (main catalog) ──────────────────────────────────────────
create table public.styles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,          -- public style_id
  label         text not null,
  description   text not null default '',
  category      text not null,
  tags          text[] not null default '{}',
  preview_image text not null,
  examples      jsonb not null default '[]',   -- [url, ...] example images
  creator       uuid references auth.users(id) on delete set null,
  usage_count   bigint not null default 0,
  like_count    bigint not null default 0,
  is_premium    boolean not null default false,
  status        text not null default 'active', -- active | draft | archived
  "order"       integer not null default 0,

  -- Private (server-only) columns — never returned to clients.
  prompt            text not null,
  negative_prompt   text,
  model             text,                      -- recommended model id ('auto' = provider decides)
  generation_config jsonb,                     -- per-provider knobs (ex-providerOverrides)

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Keep updated_at fresh.
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger styles_set_updated_at
  before update on public.styles
  for each row execute function public.set_updated_at();

-- ── Seed official styles (from the retired static styles-catalog.ts) ─
insert into public.styles
  (slug, label, description, category, tags, preview_image, examples, "order", prompt, model, generation_config)
values
  ('anime', 'Anime', 'Japanese anime look', 'anime',
   '{anime}', '/styles/api/anime.png', '["/styles/api/anime.png"]', 10,
   'Transform this photo into a Japanese anime style illustration with clean line art, vibrant cel shading and expressive eyes, keeping the original composition and subject',
   'auto', '{"dashscope":{"dashscopeFunction":"control_cartoon_feature"},"mock":{"mockFilter":"saturate"}}'),
  ('sci-fi', 'Sci-Fi', 'Futuristic neon glow', 'photo',
   '{sci-fi,neon}', '/styles/api/sci-fi.png', '["/styles/api/sci-fi.png"]', 11,
   'Transform this photo into a sci-fi scene with futuristic neon glow, cyberpunk lighting and high-tech atmosphere, keeping the original subject',
   'auto', '{"dashscope":{"dashscopeFunction":"stylization_all"},"mock":{"mockFilter":"tint"}}'),
  ('hk', 'Hong Kong', 'Retro HK cinema', 'photo',
   '{retro,film}', '/styles/api/hk.png', '["/styles/api/hk.png"]', 12,
   'Transform this photo into a retro Hong Kong cinema look with warm nostalgic tones, film grain and 90s atmosphere, keeping the original subject',
   'auto', '{"dashscope":{"dashscopeFunction":"stylization_all"},"mock":{"mockFilter":"sepia"}}'),
  ('oil-painting', 'Oil Painting', 'Classic canvas texture', 'painting',
   '{painting,canvas}', '/styles/api/oil-painting.png', '["/styles/api/oil-painting.png"]', 13,
   'Transform this photo into an oil painting with visible brush strokes, rich canvas texture and classic painterly style, keeping the original subject',
   'auto', '{"dashscope":{"dashscopeFunction":"stylization_all"},"mock":{"mockFilter":"sepia"}}'),
  ('sketch', 'Sketch', 'Pencil line drawing', 'sketch',
   '{sketch,pencil}', '/styles/api/sketch.png', '["/styles/api/sketch.png"]', 14,
   'Transform this photo into a pencil sketch drawing with clean line work and grayscale shading, keeping the original subject and composition',
   'auto', '{"dashscope":{"dashscopeFunction":"stylization_all"},"mock":{"mockFilter":"grayscale"}}'),
  ('watercolor', 'Watercolor', 'Soft painted washes', 'painting',
   '{painting,soft}', '/styles/api/watercolor.png', '["/styles/api/watercolor.png"]', 15,
   'Transform this photo into a soft watercolor painting with gentle color washes and delicate brush strokes, keeping the original subject',
   'auto', '{"dashscope":{"dashscopeFunction":"stylization_all"},"mock":{"mockFilter":"saturate"}}')
on conflict (slug) do nothing;

-- ── Saved styles ───────────────────────────────────────────────────
create table public.saved_styles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  style_id   uuid not null references public.styles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, style_id)
);

-- Increment a style's usage counter (called by the server after a success).
create or replace function public.increment_style_usage(p_slug text)
returns void language plpgsql security definer as $$
begin
  update public.styles set usage_count = usage_count + 1, updated_at = now()
    where slug = p_slug;
end; $$;

-- ── RLS ────────────────────────────────────────────────────────────
-- styles: deliberately NO select policy → clients can never read prompts.
-- Only the service_role (bypassing RLS) reads via /api/styles.
alter table public.styles enable row level security;

alter table public.saved_styles enable row level security;
create policy "read own saved"   on public.saved_styles for select using (auth.uid() = user_id);
create policy "insert own saved" on public.saved_styles for insert with check (auth.uid() = user_id);
create policy "delete own saved" on public.saved_styles for delete using (auth.uid() = user_id);

-- ⚠️ Security fix: anon/authenticated clients could SELECT prompt directly
-- from user_styles via this policy. Public style reads must go through
-- /api/styles only.
drop policy if exists "read approved styles" on public.user_styles;
