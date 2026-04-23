-- Tabla de fechas especiales por cliente (cumpleaños, aniversarios, etc.)
-- Identificado por tenant + email + tipo, sin requerir tabla de clientes propia.

CREATE TABLE IF NOT EXISTS bookido_client_dates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT        NOT NULL,
  customer_email TEXT     NOT NULL,
  customer_name  TEXT     NOT NULL,
  date_type   TEXT        NOT NULL DEFAULT 'birthday', -- 'birthday' | 'anniversary' | 'other'
  label       TEXT,                                    -- etiqueta libre para 'other'
  month       INT         NOT NULL CHECK (month BETWEEN 1 AND 12),
  day         INT         NOT NULL CHECK (day BETWEEN 1 AND 31),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_slug, customer_email, date_type)
);

CREATE INDEX IF NOT EXISTS idx_client_dates_tenant
  ON bookido_client_dates (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_client_dates_month_day
  ON bookido_client_dates (tenant_slug, month, day);
