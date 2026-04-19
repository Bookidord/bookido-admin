import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// One-time migration endpoint — DELETE after running once.
// Protected by MIGRATION_SECRET env var.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-migration-secret");
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const results: Record<string, string> = {};

  // 1. Add columns to tenants
  const tenantAlters = [
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Santo_Domingo'`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS legal_name TEXT`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_id TEXT`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS hero_copy TEXT`,
  ];

  // 2. Create bookido_business_hours
  const createBusinessHours = `
    CREATE TABLE IF NOT EXISTS bookido_business_hours (
      id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_slug TEXT    NOT NULL REFERENCES tenants(slug) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      is_open     BOOLEAN DEFAULT true,
      slots       JSONB   DEFAULT '[{"open":"09:00","close":"18:00"}]',
      UNIQUE(tenant_slug, day_of_week)
    )`;

  // 3. Create bookido_booking_policies
  const createPolicies = `
    CREATE TABLE IF NOT EXISTS bookido_booking_policies (
      id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_slug             TEXT    NOT NULL UNIQUE REFERENCES tenants(slug) ON DELETE CASCADE,
      min_advance_hours       INTEGER DEFAULT 1,
      max_advance_days        INTEGER DEFAULT 60,
      cancellation_policy     TEXT    DEFAULT 'Cancela con 24h de antelación.',
      require_deposit         BOOLEAN DEFAULT false,
      deposit_amount          NUMERIC DEFAULT 0
    )`;

  // 4. Create bookido_message_templates
  const createTemplates = `
    CREATE TABLE IF NOT EXISTS bookido_message_templates (
      id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_slug TEXT    NOT NULL REFERENCES tenants(slug) ON DELETE CASCADE,
      key         TEXT    NOT NULL,
      channel     TEXT    DEFAULT 'whatsapp',
      enabled     BOOLEAN DEFAULT true,
      subject     TEXT,
      body        TEXT    NOT NULL,
      UNIQUE(tenant_slug, key)
    )`;

  // 5. Create bookido_special_days
  const createSpecialDays = `
    CREATE TABLE IF NOT EXISTS bookido_special_days (
      id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_slug    TEXT    NOT NULL REFERENCES tenants(slug) ON DELETE CASCADE,
      date           DATE    NOT NULL,
      is_closed      BOOLEAN DEFAULT true,
      reason         TEXT    DEFAULT 'custom',
      reason_detail  TEXT,
      UNIQUE(tenant_slug, date)
    )`;

  const ddls = [
    ...tenantAlters,
    createBusinessHours,
    createPolicies,
    createTemplates,
    createSpecialDays,
  ];

  for (const sql of ddls) {
    const label = sql.trim().split("\n")[0].slice(0, 60);
    try {
      const { error } = await supabase.rpc("exec_sql", { query: sql });
      results[label] = error ? `warn: ${error.message}` : "ok";
    } catch {
      results[label] = "warn: rpc not available";
    }
  }

  // Seed default business_hours for all tenants (7 days, open Mon-Sat)
  try {
    const { data: tenants } = await supabase.from("tenants").select("slug");
    for (const t of tenants ?? []) {
      for (let dow = 0; dow <= 6; dow++) {
        const isOpen = dow >= 1 && dow <= 6; // Mon-Sat open, Sun closed
        await supabase.from("bookido_business_hours").upsert({
          tenant_slug: t.slug,
          day_of_week: dow,
          is_open: isOpen,
          slots: [{ open: "09:00", close: "18:00" }],
        }, { onConflict: "tenant_slug,day_of_week", ignoreDuplicates: true });
      }
      await supabase.from("bookido_booking_policies").upsert({
        tenant_slug: t.slug,
        min_advance_hours: 1,
        max_advance_days: 60,
        cancellation_policy: "Cancela con 24h de antelación.",
      }, { onConflict: "tenant_slug", ignoreDuplicates: true });
    }
    results["seed_defaults"] = `ok (${tenants?.length ?? 0} tenants)`;
  } catch (e) {
    results["seed_defaults"] = `warn: ${(e as Error).message}`;
  }

  return NextResponse.json({ ok: true, results });
}
