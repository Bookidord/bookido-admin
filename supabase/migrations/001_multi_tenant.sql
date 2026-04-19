-- ─── Bookido Multi-Tenant Migration ──────────────────────────────────────────
-- Run this in Supabase → SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).

-- ─── 1. tenants table ─────────────────────────────────────────────────────────

create table if not exists public.tenants (
  slug          text primary key,
  business_name text        not null default 'Mi Negocio',
  email         text        not null unique,
  plan          text        not null default 'basic'
                            check (plan in ('basic', 'pro')),
  is_active     boolean     not null default true,
  -- Business settings (editable from /panel/configuracion)
  whatsapp      text        not null default '',
  open_hour     integer     not null default 10,
  close_hour    integer     not null default 20,
  description   text        not null default '',
  primary_color text        not null default '#be185d',
  created_at    timestamptz not null default now()
);

-- ─── 2. Ensure tenant_slug columns exist ──────────────────────────────────────

alter table public.bookido_services
  add column if not exists tenant_slug text not null default '';

alter table public.bookido_bookings
  add column if not exists tenant_slug text not null default '';

-- ─── 3. Migrate existing data to yorbana tenant ───────────────────────────────

update public.bookido_services
  set tenant_slug = 'yorbana'
  where tenant_slug = '';

update public.bookido_bookings
  set tenant_slug = 'yorbana'
  where tenant_slug = '';

-- ─── 4. Seed yorbana tenant row ───────────────────────────────────────────────

insert into public.tenants
  (slug, business_name, email, plan, is_active, whatsapp, open_hour, close_hour, description, primary_color)
values
  ('yorbana', 'Yorbana Nail Estudio', 'giolbana@yorbana.com', 'basic', true,
   '18096106459', 9, 19, 'Nail salon en Santo Domingo, RD', '#be185d')
on conflict (slug) do nothing;

-- ─── 5. Performance indexes ───────────────────────────────────────────────────

create index if not exists idx_services_tenant
  on public.bookido_services(tenant_slug);

create index if not exists idx_bookings_tenant
  on public.bookido_bookings(tenant_slug);

create index if not exists idx_bookings_starts_at
  on public.bookido_bookings(starts_at);

create index if not exists idx_bookings_tenant_starts
  on public.bookido_bookings(tenant_slug, starts_at);

-- ─── 6. Row Level Security ────────────────────────────────────────────────────
-- The service role key (used server-side) bypasses RLS automatically.
-- These policies govern anon / authenticated client-side access.

alter table public.tenants          enable row level security;
alter table public.bookido_services enable row level security;
alter table public.bookido_bookings enable row level security;

-- Tenants: public read (needed for settings lookups)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tenants' and policyname = 'tenants_public_read'
  ) then
    create policy "tenants_public_read" on public.tenants
      for select using (true);
  end if;
end $$;

-- Services: public read for active services (public booking page uses anon key)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'bookido_services' and policyname = 'services_public_read'
  ) then
    create policy "services_public_read" on public.bookido_services
      for select using (active = true);
  end if;
end $$;

-- Bookings: no direct client-side access — all writes go through service role
-- (server actions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)
