"use server";

import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createSsrClient } from "@/lib/supabase/ssr";
import { sendWelcomeEmail } from "@/lib/email";

const TEMPLATE_COLORS: Record<string, string> = {
  nail_studio: "#be185d",
  barbershop:  "#1e40af",
  spa:         "#065f46",
  salon:       "#7c3aed",
  restaurant:  "#b45309",
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export async function registrarNegocioAction(input: {
  business_name: string;
  slug: string;
  template: string;
  email: string;
  password: string;
  whatsapp?: string;
}): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const admin = createServiceSupabaseClient();
  if (!admin) return { ok: false, error: "Servicio no disponible." };

  // ── Validate slug ──────────────────────────────────────────────────────────
  const slug = input.slug.toLowerCase().trim();
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: "El subdominio solo puede tener letras, números y guiones (mín. 3 caracteres)." };
  }
  const RESERVED = ["admin","www","api","app","panel","mail","smtp","ftp","bookido","registro","login","dashboard"];
  if (RESERVED.includes(slug)) return { ok: false, error: "Ese subdominio está reservado." };

  const { data: existing } = await admin.from("tenants").select("slug").eq("slug", slug).maybeSingle();
  if (existing) return { ok: false, error: "Ese subdominio ya está en uso. Elige otro." };

  const name = input.business_name.trim();
  if (name.length < 2) return { ok: false, error: "El nombre del negocio es muy corto." };

  // ── Create Supabase auth user ─────────────────────────────────────────────
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
  });
  if (authErr) return { ok: false, error: authErr.message };
  const userId = authData.user.id;

  const heroColor = TEMPLATE_COLORS[input.template] ?? "#14F195";

  // ── Create tenant + supporting rows ───────────────────────────────────────
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // 14-day trial

  const { data: plan } = await admin.from("bookido_plans")
    .select("id").eq("name", "Básico").maybeSingle();
  const planId = plan?.id;

  const hours = Array.from({ length: 7 }, (_, d) => ({
    tenant_slug: slug,
    day_of_week: d,
    is_open: d >= 1 && d <= 6,
    slots: [{ open: "09:00", close: "18:00" }],
  }));

  const [tenantRes, landingRes, hoursRes, subRes] = await Promise.all([
    admin.from("tenants").insert({
      id: userId,
      slug,
      name,
      owner_email: input.email.trim().toLowerCase(),
      settings: input.whatsapp ? { whatsapp: input.whatsapp } : {},
      timezone: "America/Santo_Domingo",
    }),
    admin.from("bookido_landings").insert({
      tenant_slug: slug,
      business_name: name,
      is_active: true,
      template: input.template,
      hero_color: heroColor,
      show_booking_button: true,
      custom_cta_text: "Reservar cita",
    }),
    admin.from("bookido_business_hours").insert(hours),
    planId
      ? admin.from("bookido_subscriptions").insert({
          tenant_slug: slug,
          plan_id: planId,
          status: "trial",
          start_date: new Date().toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        })
      : Promise.resolve({ error: null }),
  ]);

  if (tenantRes.error) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: tenantRes.error.message };
  }
  if (landingRes.error || hoursRes.error) {
    // Non-fatal — tenant was created, just log
    console.error("[registro] secondary insert error", landingRes.error ?? hoursRes.error);
  }

  // ── Sign in the user via SSR client ───────────────────────────────────────
  const ssr = await createSsrClient();
  await ssr.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  // ── Welcome email (non-blocking) ─────────────────────────────────────────
  sendWelcomeEmail({ to: input.email.trim().toLowerCase(), businessName: name, slug })
    .catch(err => console.error("[registro] Welcome email failed:", err));

  const isProd = process.env.NODE_ENV === "production";
  const redirectUrl = isProd
    ? `https://${slug}.bookido.online/panel`
    : `/panel`;

  return { ok: true, redirectUrl };
}

export async function checkSlugAvailableAction(
  slug: string,
): Promise<{ available: boolean }> {
  const admin = createServiceSupabaseClient();
  if (!admin) return { available: false };
  const clean = slug.toLowerCase().trim();
  if (!SLUG_RE.test(clean)) return { available: false };
  const { data } = await admin.from("tenants").select("slug").eq("slug", clean).maybeSingle();
  return { available: !data };
}
