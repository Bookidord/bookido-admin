"use server";

import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createSsrClient } from "@/lib/supabase/ssr";
import { sendWelcomeEmail } from "@/lib/email";
import { generateLandingContent } from "@/lib/ai-landing-generator";

const TEMPLATE_COLORS: Record<string, string> = {
  nail_studio: "#be185d",
  barbershop:  "#1e40af",
  spa:         "#065f46",
  salon:       "#7c3aed",
  restaurant:  "#b45309",
};

const TEMPLATE_DEFAULTS: Record<string, { tagline: string; description: string; custom_cta_text: string }> = {
  nail_studio: {
    tagline: "Tu espacio para uñas perfectas",
    description: "Transformamos tus uñas con los mejores productos y técnicas del momento.",
    custom_cta_text: "Reservar mi cita",
  },
  barbershop: {
    tagline: "Tu look, nuestro arte",
    description: "Cortes modernos y clásicos con la mejor atención para el caballero de hoy.",
    custom_cta_text: "Agendar corte",
  },
  spa: {
    tagline: "Tu momento de paz y bienestar",
    description: "Relájate y renueva cuerpo y mente con nuestros tratamientos profesionales.",
    custom_cta_text: "Reservar sesión",
  },
  salon: {
    tagline: "Donde tu belleza brilla",
    description: "Estilo, color y cuidado profesional para que luzcas espectacular.",
    custom_cta_text: "Agendar cita",
  },
  restaurant: {
    tagline: "Sabores que enamoran",
    description: "Una experiencia gastronómica única con los mejores ingredientes.",
    custom_cta_text: "Reservar mesa",
  },
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function registrarNegocioAction(input: {
  business_name: string;
  slug: string;
  template: string;
  email: string;
  password: string;
  whatsapp?: string;
  instagram?: string;
  turnstileToken?: string;
}): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  // Turnstile verification
  if (input.turnstileToken) {
    const valid = await verifyTurnstile(input.turnstileToken);
    if (!valid) return { ok: false, error: "Verificación de seguridad fallida. Intenta de nuevo." };
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    return { ok: false, error: "Completa la verificación de seguridad." };
  }

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
  const defaults = TEMPLATE_DEFAULTS[input.template] ?? TEMPLATE_DEFAULTS.salon;

  // ── Create tenant + supporting rows ───────────────────────────────────────
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // 14-day trial

  const { data: plan } = await admin.from("bookido_plans")
    .select("id").eq("name", "Básico").maybeSingle();
  const planId = plan?.id;

  const tenantSettings: Record<string, string> = {};
  if (input.whatsapp) tenantSettings.whatsapp = input.whatsapp;
  if (input.instagram) tenantSettings.instagram = input.instagram;

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
      settings: Object.keys(tenantSettings).length > 0 ? tenantSettings : {},
      timezone: "America/Santo_Domingo",
    }),
    admin.from("bookido_landings").insert({
      tenant_slug: slug,
      business_name: name,
      is_active: true,
      template: input.template,
      hero_color: heroColor,
      show_booking_button: true,
      tagline: defaults.tagline,
      description: defaults.description,
      custom_cta_text: defaults.custom_cta_text,
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

  // ── AI landing generation (non-blocking) ─────────────────────────────────
  generateLandingContent({
    businessName: name,
    template: input.template,
    instagram: input.instagram,
    whatsapp: input.whatsapp,
    slug,
  }).then(async (content) => {
    const adminClient = createServiceSupabaseClient();
    if (!adminClient) return;

    await adminClient.from("bookido_landings").update({
      tagline: content.tagline,
      description: content.description,
      schedule: content.schedule,
      owner_specialty: content.ownerSpecialty,
    }).eq("tenant_slug", slug);

    if (content.services?.length) {
      await adminClient.from("bookido_services").insert(
        content.services.map((s, i) => ({
          tenant_slug: slug,
          name: s.name,
          duration_minutes: s.duration,
          price: s.price,
          description: s.description,
          sort_order: i + 1,
          active: true,
        }))
      );
    }
    console.log("[registro] AI landing generated for", slug);
  }).catch(err => console.error("[registro] AI landing generation failed:", err));

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
