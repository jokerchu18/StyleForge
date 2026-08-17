-- Style ecosystem: user auth profile, community-submitted styles, and
-- subscriptions (paid gating). Supabase PostgreSQL migration.
-- auth.users is provided by Supabase Auth; these tables extend it.

-- Extend auth.users with a public display name.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Community-submitted styles. Once approved, a row is converted into a
-- StyleDefinition (engine='cloud', source='community', tier='free',
-- status='active') for the catalog and transform endpoints.
create table public.user_styles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text unique,                 -- generated on approval; becomes the style id
  label_key text not null,          -- display name (i18n key or literal label)
  description_key text not null,    -- description
  category text not null,           -- open-ended StyleCategory string
  sample_image text not null,       -- uploaded sample image storage URL
  prompt text not null,             -- authoritative style instruction (cloud-only)
  tags text[] not null default '{}',
  status text not null default 'pending', -- pending / approved / rejected / archived
  review_note text,                 -- rejection reason
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Paid gating: subscription state. Reserved; gating logic comes later.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free',     -- free / premium
  status text not null default 'active',
  provider text,                          -- stripe / lemon-squeezy / paddle
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Keep user_styles.updated_at fresh.
create function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_styles_set_updated_at
  before update on public.user_styles
  for each row execute function public.set_updated_at();

-- Row Level Security (all tables).
-- profiles: public read (display name for attribution); users update their own.
alter table public.profiles enable row level security;

create policy "read all profiles" on public.profiles
  for select using (true);

create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- user_styles: approved styles are public; users manage only their own.
alter table public.user_styles enable row level security;

create policy "read approved styles" on public.user_styles
  for select using (status = 'approved');

create policy "read own styles" on public.user_styles
  for select using (auth.uid() = user_id);

create policy "insert own style" on public.user_styles
  for insert with check (auth.uid() = user_id);

create policy "update own style" on public.user_styles
  for update using (auth.uid() = user_id);

-- subscriptions: private; users can only read their own row (writes are done
-- server-side by the Stripe/LemonSqueezy webhook, never directly by clients).
alter table public.subscriptions enable row level security;

create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);
