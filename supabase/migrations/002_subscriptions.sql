-- ─── Bookido Subscriptions & Admin Config Migration ─────────────────────────
-- Run in Supabase → SQL Editor. Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).

-- ─── 1. Plans ─────────────────────────────────────────────────────────────────

create table if not exists public.bookido_plans (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null unique,
  duration_days integer     not null,
  price_rd      integer,    -- nullable; Johanny fills in the admin panel
  created_at    timestamptz not null default now()
);

-- Seed 3 default plans (prices null)
insert into public.bookido_plans (name, duration_days)
values
  ('Trimestral', 90),
  ('Semestral',  180),
  ('Anual',      365)
on conflict (name) do nothing;

-- ─── 2. Subscriptions ─────────────────────────────────────────────────────────

create table if not exists public.bookido_subscriptions (
  id           uuid        primary key default gen_random_uuid(),
  tenant_slug  text        not null references public.tenants(slug) on delete cascade,
  plan_id      uuid        not null references public.bookido_plans(id),
  start_date   date        not null,
  end_date     date        not null,  -- start_date + plan.duration_days
  status       text        not null default 'active'
                           check (status in ('active', 'expired', 'suspended')),
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_subscriptions_tenant
  on public.bookido_subscriptions(tenant_slug);

create index if not exists idx_subscriptions_end_date
  on public.bookido_subscriptions(end_date);

-- ─── 3. Admin config (single row) ─────────────────────────────────────────────

create table if not exists public.bookido_admin_config (
  id            integer     primary key default 1,
  password_hash text,       -- sha256(password + secret); null = use ADMIN_PASSWORD env
  alert_days    integer     not null default 15
);

insert into public.bookido_admin_config (id, alert_days)
values (1, 15)
on conflict (id) do nothing;

-- ─── 4. Seed Yorbana subscription (Trimestral, start today) ──────────────────

insert into public.bookido_subscriptions (tenant_slug, plan_id, start_date, end_date, status)
select
  'yorbana-nail-estudio',
  p.id,
  current_date,
  current_date + p.duration_days,
  'active'
from public.bookido_plans p
where p.name = 'Trimestral'
  and not exists (
    select 1 from public.bookido_subscriptions where tenant_slug = 'yorbana-nail-estudio'
  );

-- ─── 5. RLS ───────────────────────────────────────────────────────────────────

alter table public.bookido_plans          enable row level security;
alter table public.bookido_subscriptions  enable row level security;
alter table public.bookido_admin_config   enable row level security;

-- Plans: public read
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'bookido_plans' and policyname = 'plans_public_read'
  ) then
    create policy "plans_public_read" on public.bookido_plans for select using (true);
  end if;
end $$;

-- Subscriptions: no direct client access (all ops via service role in server actions)
-- Admin config: no direct client access
