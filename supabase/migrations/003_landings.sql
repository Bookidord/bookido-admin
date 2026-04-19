-- ─── Bookido Landing Pages Migration ─────────────────────────────────────────
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).

create table if not exists public.bookido_landings (
  id                  uuid        primary key default gen_random_uuid(),
  tenant_slug         text        not null unique references public.tenants(slug) on delete cascade,
  is_active           boolean     not null default false,
  template            text        not null default 'nail_studio'
                                  check (template in ('nail_studio','barbershop','spa','salon','restaurant')),
  business_name       text        not null default '',
  tagline             text,
  description         text,
  whatsapp            text,
  address             text,
  schedule            text,
  hero_color          text        not null default '#be185d',
  photo_url_1         text,
  photo_url_2         text,
  photo_url_3         text,
  instagram_url       text,
  tiktok_url          text,
  facebook_url        text,
  show_booking_button boolean     not null default true,
  custom_cta_text     text        not null default 'Reservar cita',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.bookido_landings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'bookido_landings' and policyname = 'landings_public_read'
  ) then
    create policy "landings_public_read"
      on public.bookido_landings for select using (true);
  end if;
end $$;

-- Seed Yorbana landing
insert into public.bookido_landings
  (tenant_slug, is_active, template, business_name, tagline, description,
   hero_color, custom_cta_text, show_booking_button)
values (
  'yorbana-nail-estudio',
  true,
  'nail_studio',
  'Yorbana Nail Estudio',
  'Las uñas que mereces, en Santiago',
  'Somos un estudio especializado en nail art, uñas acrílicas y manicura profesional. Cada cita es una experiencia — te mimamos desde que llegas hasta que te vas.',
  '#be185d',
  'Reservar mi cita',
  true
)
on conflict (tenant_slug) do update set
  is_active           = excluded.is_active,
  template            = excluded.template,
  business_name       = excluded.business_name,
  tagline             = excluded.tagline,
  description         = excluded.description,
  hero_color          = excluded.hero_color,
  custom_cta_text     = excluded.custom_cta_text,
  show_booking_button = excluded.show_booking_button,
  updated_at          = now();
