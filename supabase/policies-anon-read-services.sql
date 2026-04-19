-- Ejecuta en Supabase si activas RLS en bookido_services y la landing deja de ver filas.
-- Permite lectura pública solo de servicios activos (anon key).

alter table public.bookido_services enable row level security;

drop policy if exists "bookido_services_public_read_active" on public.bookido_services;

create policy "bookido_services_public_read_active"
  on public.bookido_services
  for select
  to anon, authenticated
  using (active = true);
