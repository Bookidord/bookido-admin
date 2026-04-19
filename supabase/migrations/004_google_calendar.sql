-- ─── Google Calendar Sync Migration ─────────────────────────────────────────
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).

-- ─── 1. google_calendar_connections ─────────────────────────────────────────

create table if not exists public.google_calendar_connections (
  id                uuid        primary key default gen_random_uuid(),
  tenant_slug       text        not null unique references public.tenants(slug) on delete cascade,
  google_user_email text        not null,
  access_token_enc  text        not null,
  refresh_token_enc text        not null,
  calendar_id       text        not null default 'primary',
  sync_enabled      boolean     not null default true,
  last_sync_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;

-- Only service role can read/write (server-side only)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'google_calendar_connections' and policyname = 'gcal_service_only'
  ) then
    create policy "gcal_service_only"
      on public.google_calendar_connections for all
      using (false);
  end if;
end $$;

-- ─── 2. external_blocked_slots ───────────────────────────────────────────────

create table if not exists public.external_blocked_slots (
  id              uuid        primary key default gen_random_uuid(),
  tenant_slug     text        not null references public.tenants(slug) on delete cascade,
  google_event_id text        not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  summary         text,
  created_at      timestamptz not null default now(),
  unique (tenant_slug, google_event_id)
);

create index if not exists external_blocked_slots_tenant_time
  on public.external_blocked_slots (tenant_slug, starts_at, ends_at);

alter table public.external_blocked_slots enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'external_blocked_slots' and policyname = 'blocked_service_only'
  ) then
    create policy "blocked_service_only"
      on public.external_blocked_slots for all
      using (false);
  end if;
end $$;

-- ─── 3. Add google_event_id to bookido_bookings ───────────────────────────────

alter table public.bookido_bookings
  add column if not exists google_event_id text;
