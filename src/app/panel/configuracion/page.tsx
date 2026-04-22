import { getSettings } from "@/lib/settings";
import { getTenantSlug } from "@/lib/tenant";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { GoogleCalendarCard } from "@/components/panel/GoogleCalendarCard";
import { ConfiguracionTabs } from "@/components/panel/ConfiguracionTabs";

export const dynamic = "force-dynamic";

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_open: i >= 1 && i <= 6,
  slots: [{ open: "09:00", close: "18:00" }],
}));

const DEFAULT_POLICIES = {
  min_advance_hours: 1,
  max_advance_days: 60,
  cancellation_policy: "Cancela con 24h de antelación.",
  require_deposit: false,
  deposit_amount: 0,
};

const DEFAULT_TEMPLATES = [
  { key: "confirmation",   channel: "whatsapp", enabled: true,  subject: "Reserva confirmada",       body: "✅ ¡Reserva confirmada, {nombre}!\n\n📅 {fecha} a las {hora}\n💅 {servicio}\n📍 {direccion}\n\n¡Te esperamos en {negocio}!" },
  { key: "reminder_24h",   channel: "whatsapp", enabled: true,  subject: "Recordatorio de turno",     body: "⏰ Mañana tienes un turno en *{negocio}*\n\n📅 {fecha} a las {hora}\n💅 {servicio}\n📍 {direccion}" },
  { key: "cancellation",   channel: "whatsapp", enabled: true,  subject: "Reserva cancelada",         body: "❌ Tu reserva del {fecha} a las {hora} en *{negocio}* ha sido cancelada." },
  { key: "thank_you",      channel: "whatsapp", enabled: true,  subject: "Gracias por tu visita",     body: "🙏 Gracias por visitarnos, {nombre}. ¡Hasta la próxima en *{negocio}*!" },
  { key: "review_request", channel: "whatsapp", enabled: false, subject: "Cuéntanos tu experiencia",  body: "⭐ Hola {nombre}, ¿cómo te fue en *{negocio}*? Tu opinión nos ayuda a mejorar." },
];

export default async function ConfiguracionPage() {
  const [settings, tenant] = await Promise.all([getSettings(), getTenantSlug()]);
  const admin = createServiceSupabaseClient();

  let businessHours = DEFAULT_HOURS;
  let policies = DEFAULT_POLICIES;
  let templates = DEFAULT_TEMPLATES;
  let specialDays: { date: string; is_closed: boolean; reason: string; reason_detail: string | null }[] = [];
  let tenantExtra: { logo_url?: string | null; address?: string | null; legal_name?: string | null; tax_id?: string | null; hero_copy?: string | null } = {};
  let landingConfig: import("@/app/panel/configuracion/actions").LandingConfig | null = null;

  if (admin) {
    try {
      const [bhRes, polRes, tplRes, sdRes, tenantRes] = await Promise.all([
        admin.from("bookido_business_hours").select("*").eq("tenant_slug", tenant).order("day_of_week"),
        admin.from("bookido_booking_policies").select("*").eq("tenant_slug", tenant).maybeSingle(),
        admin.from("bookido_message_templates").select("*").eq("tenant_slug", tenant),
        admin.from("bookido_special_days").select("*").eq("tenant_slug", tenant).gte("date", new Date().toISOString().split("T")[0]).order("date"),
        admin.from("tenants").select("logo_url, address, legal_name, tax_id, hero_copy").eq("slug", tenant).maybeSingle(),
      ]);
      if (bhRes.data?.length) businessHours = bhRes.data;
      if (polRes.data) policies = { ...DEFAULT_POLICIES, ...polRes.data };
      if (tplRes.data?.length) {
        templates = DEFAULT_TEMPLATES.map(dt => {
          const saved = (tplRes.data as Array<{ key: string }>).find(t => t.key === dt.key);
          return saved ? { ...dt, ...saved } : dt;
        });
      }
      if (sdRes.data) specialDays = sdRes.data;
      if (tenantRes.data) tenantExtra = tenantRes.data;
      // Load landing config from Storage JSON (no DB columns needed)
      try {
        const { data: blob } = await admin.storage.from("bookido-media").download(`config/${tenant}.json`);
        if (blob) { const text = await blob.text(); landingConfig = JSON.parse(text); }
      } catch { /* no config yet */ }
    } catch { /* tables may not exist yet — use defaults */ }
  }

  const authUrl = `/api/google/auth`;
  let googleConn = null;
  try {
    if (admin) {
      const { data } = await admin.from("google_calendar_connections")
        .select("google_user_email, sync_enabled, last_sync_at")
        .eq("tenant_slug", tenant).maybeSingle();
      googleConn = data ?? null;
    }
  } catch { /* table may not exist */ }

  const bookingUrl = process.env.NODE_ENV === "production"
    ? `https://${tenant}.bookido.online/reserva`
    : `/reserva`;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Personaliza tu negocio. Los cambios se aplican de inmediato.
        </p>
      </div>

      <ConfiguracionTabs
        settings={{ ...settings, ...tenantExtra }}
        businessHours={businessHours}
        policies={policies}
        templates={templates}
        specialDays={specialDays}
        tenant={tenant}
        bookingUrl={bookingUrl}
        landingConfig={landingConfig}
      />

      <div className="mt-6">
        <GoogleCalendarCard connection={googleConn} authUrl={authUrl} />
      </div>
    </div>
  );
}
