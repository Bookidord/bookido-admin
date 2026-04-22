-- Ejecuta este script en Supabase → SQL Editor (ajusta nombres si ya tienes tablas propias).
-- BookiDo: servicios y reservas por tenant (slug).

create table if not exists public.bookido_services (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null default 'yorbana',
  name text not null,
  duration_minutes int not null check (duration_minutes > 0),
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.bookido_bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  service_id uuid references public.bookido_services (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  notes text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  constraint bookido_bookings_time_order check (ends_at > starts_at)
);

create index if not exists bookido_bookings_tenant_starts
  on public.bookido_bookings (tenant_slug, starts_at);

-- Datos de ejemplo para Yorbana (solo si la tabla está vacía)
insert into public.bookido_services (tenant_slug, name, duration_minutes, sort_order)
select 'yorbana', v.name, v.mins, v.ord
from (
  values
    ('Manicura', 45, 1),
    ('Pedicura', 60, 2),
    ('Nail art', 75, 3)
) as v(name, mins, ord)
where not exists (select 1 from public.bookido_services where tenant_slug = 'yorbana');

-- La app usa la service role key solo en el servidor; sin RLS estas tablas son accesibles
-- desde el proyecto. Para producción, activa RLS y políticas acotadas o usa RPC.
