# Dashboard — Schema pendiente

Módulos planificados que requieren migración de base de datos antes de implementar.

## Módulo 10 — Meta del mes (barra de progreso)
```sql
ALTER TABLE tenants ADD COLUMN meta_mensual_citas INT;
```
UI: barra animada en el dashboard mostrando reservas del mes vs meta.

## Módulo 12 — Cumpleaños de clientes 🎂
```sql
CREATE TABLE bookido_customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT REFERENCES tenants(slug) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  birth_date  DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```
UI: card en dashboard con clientes que cumplen años hoy.

## Módulo 14 — Última review/testimonio 5★
```sql
CREATE TABLE bookido_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT REFERENCES tenants(slug) ON DELETE CASCADE,
  booking_id  UUID REFERENCES bookido_bookings(id) ON DELETE SET NULL,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```
UI: card mostrando la última review con ≥ 4 estrellas.
Flujo: enviar link de review por WA/email tras la reserva, capturar en página pública.
