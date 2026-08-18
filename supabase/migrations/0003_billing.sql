-- ⚡ Generations billing core.
-- Generations are the single charging unit (never per-Style). All balance
-- changes go through credit_transactions; money moves only happen server-side
-- via the spend/refund/grant RPCs (service_role). Clients can only read their
-- own rows — they can never write a balance.

-- ── Balance ────────────────────────────────────────────────────────
create table public.credit_balances (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  balance         integer not null default 0,
  free_cycle_start timestamptz,              -- anchor for lazy Free monthly reset
  updated_at      timestamptz not null default now()
);

-- ── Transaction ledger ─────────────────────────────────────────────
create table public.credit_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       integer not null,             -- +grant / -charge / +refund
  type         text not null,                -- initial | grant | charge | refund | reset
  status       text not null default 'completed', -- pending | completed | refunded
  reference_id uuid,                         -- links a generations.id (idempotency)
  description  text,
  created_at   timestamptz not null default now()
);

-- ── Generations history ────────────────────────────────────────────
create table public.generations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  style_id        text not null,
  model           text not null,
  generation_type text not null,             -- cost tier: standard | premium | ultra
  cost_units      integer not null,
  input_image     text,                      -- Storage URL (optional)
  output_image    text,                      -- Storage URL
  seed            bigint,
  status          text not null default 'succeeded', -- pending | succeeded | failed | refunded
  created_at      timestamptz not null default now()
);

-- ── Extend subscriptions (was created in 0001) ─────────────────────
alter table public.subscriptions
  add column if not exists period_start           timestamptz,
  add column if not exists period_end             timestamptz,
  add column if not exists cancel_at_period_end   boolean not null default false,
  add column if not exists last_granted_period_start timestamptz, -- idempotent grant anchor
  add column if not exists ls_variant_id          bigint,
  add column if not exists ls_customer_id         bigint;

-- ── New-user onboarding ────────────────────────────────────────────
-- Creates profile + free subscription + 10 initial Generations in one place.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.subscriptions (user_id, plan, status)
    values (new.id, 'free', 'active') on conflict (user_id) do nothing;
  insert into public.credit_balances (user_id, balance, free_cycle_start)
    values (new.id, 10, now()) on conflict (user_id) do nothing;
  insert into public.credit_transactions (user_id, amount, type, description)
    values (new.id, 10, 'initial', 'Welcome — 10 free generations');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Atomic balance RPCs (service_role only — not exposed to clients) ─
create or replace function public.spend_generations(p_user uuid, p_units integer)
returns integer language plpgsql as $$
declare v_bal integer;
begin
  select balance into v_bal
    from public.credit_balances where user_id = p_user for update;
  if v_bal is null or v_bal < p_units then
    return null;
  end if;
  update public.credit_balances
    set balance = balance - p_units, updated_at = now()
    where user_id = p_user;
  return v_bal - p_units;
end; $$;

create or replace function public.refund_generations(p_user uuid, p_units integer)
returns integer language plpgsql as $$
begin
  update public.credit_balances
    set balance = balance + p_units, updated_at = now()
    where user_id = p_user;
  return p_units;
end; $$;

create or replace function public.grant_generations(p_user uuid, p_units integer)
returns integer language plpgsql as $$
begin
  insert into public.credit_balances (user_id, balance, free_cycle_start)
    values (p_user, p_units, now())
  on conflict (user_id) do update
    set balance = credit_balances.balance + p_units, updated_at = now();
  return (select balance from public.credit_balances where user_id = p_user);
end; $$;

-- ── RLS: read own only; no client write policies ───────────────────
alter table public.credit_balances enable row level security;
create policy "read own balance" on public.credit_balances
  for select using (auth.uid() = user_id);

alter table public.credit_transactions enable row level security;
create policy "read own transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

alter table public.generations enable row level security;
create policy "read own generations" on public.generations
  for select using (auth.uid() = user_id);
