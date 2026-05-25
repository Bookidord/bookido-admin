import "@/styles/tokens.css";
import { SidebarV2 } from "@/components/panel-v2/SidebarV2";
import { TopStatsBar } from "@/components/panel-v2/TopStatsBar";
import { HeroCompact } from "@/components/panel-v2/HeroCompact";
import { MetricRowCompact } from "@/components/panel-v2/MetricRowCompact";
import { StatusSync } from "@/components/panel-v2/StatusSync";
import { BookidoAICard } from "@/components/panel-v2/BookidoAICard";
import type { MetricCard } from "@/components/panel-v2/MetricRowCompact";
import { notFound } from "next/navigation";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Panel V2 QA Preview \u2014 Bookido",
};

const MOCK_TENANTS: Record<
  string,
  { name: string; accent: string; whatsapp: string; plan: string; metrics: MetricCard[] }
> = {
  yorbana: {
    name: "Yorbana Nail Estudio",
    accent: "#BE185D",
    whatsapp: "18094535662",
    plan: "Plan Fundador",
    metrics: [
      { label: "Reservas hoy", value: "8", trend: "+12%", trendUp: true, icon: "\ud83d\udcc5", sparkline: [3, 5, 4, 7, 6, 8, 8] },
      { label: "Esta semana", value: "34", trend: "+35%", trendUp: true, icon: "\ud83d\udcca", sparkline: [18, 22, 25, 28, 30, 32, 34] },
      { label: "Ingresos mes", value: "RD$2,450", trend: "+18%", trendUp: true, icon: "\ud83d\udcb0", sparkline: [800, 1200, 1500, 1800, 2100, 2300, 2450] },
      { label: "Por confirmar", value: "3", trend: "-2", trendUp: false, icon: "\u23f3", sparkline: [6, 5, 4, 5, 3, 4, 3] },
      { label: "Clientes nuevos", value: "5", trend: "+3", trendUp: true, icon: "\ud83d\udc64", sparkline: [1, 2, 2, 3, 3, 4, 5] },
    ],
  },
  balance: {
    name: "Balance Spa",
    accent: "#14B8A6",
    whatsapp: "18095551234",
    plan: "Plan Fundador",
    metrics: [
      { label: "Reservas hoy", value: "5", trend: "+8%", trendUp: true, icon: "\ud83d\udcc5", sparkline: [2, 3, 4, 3, 5, 4, 5] },
      { label: "Esta semana", value: "22", trend: "+15%", trendUp: true, icon: "\ud83d\udcca", sparkline: [12, 14, 16, 18, 19, 21, 22] },
      { label: "Ingresos mes", value: "RD$1,800", trend: "+10%", trendUp: true, icon: "\ud83d\udcb0", sparkline: [600, 800, 1000, 1200, 1400, 1600, 1800] },
      { label: "Por confirmar", value: "2", trend: "-1", trendUp: false, icon: "\u23f3", sparkline: [4, 3, 3, 2, 3, 2, 2] },
      { label: "Clientes nuevos", value: "3", trend: "+1", trendUp: true, icon: "\ud83d\udc64", sparkline: [1, 1, 2, 2, 2, 3, 3] },
    ],
  },
  bookido: {
    name: "Bookido Demo",
    accent: "#00F8A0",
    whatsapp: "447586255903",
    plan: "Demo",
    metrics: [
      { label: "Reservas hoy", value: "12", trend: "+22%", trendUp: true, icon: "\ud83d\udcc5", sparkline: [5, 7, 8, 9, 10, 11, 12] },
      { label: "Esta semana", value: "48", trend: "+40%", trendUp: true, icon: "\ud83d\udcca", sparkline: [20, 28, 32, 36, 40, 44, 48] },
      { label: "Ingresos mes", value: "RD$3,200", trend: "+25%", trendUp: true, icon: "\ud83d\udcb0", sparkline: [1000, 1400, 1800, 2200, 2600, 2900, 3200] },
      { label: "Por confirmar", value: "4", trend: "-3", trendUp: false, icon: "\u23f3", sparkline: [8, 7, 6, 5, 5, 4, 4] },
      { label: "Clientes nuevos", value: "7", trend: "+4", trendUp: true, icon: "\ud83d\udc64", sparkline: [2, 3, 3, 4, 5, 6, 7] },
    ],
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const MOCK_BRIEFINGS: Record<string, any> = {
  yorbana: {
    tenant: "yorbana-nail",
    tenant_name: "Yorbana Nail Estudio",
    date: "2026-05-25",
    summary:
      "Hoy domingo no hay reservas en Yorbana. Con solo 2 reservas en los \u00faltimos 30 d\u00edas, el estudio necesita atenci\u00f3n urgente en captaci\u00f3n de clientes.",
    alerts: [
      {
        type: "low_traffic",
        severity: "high",
        message:
          "Cero reservas esta semana y solo RD$700 generados en 30 d\u00edas. Actividad cr\u00edticamente baja.",
        suggested_action:
          "Revis\u00e1 si el enlace de reservas est\u00e1 activo y funcionando.",
      },
      {
        type: "low_traffic",
        severity: "medium",
        message: "Ma\u00f1ana lunes tiene 8 horas disponibles sin ocupar.",
        suggested_action:
          "Contact\u00e1 clientes directamente por WhatsApp o Instagram DM.",
      },
    ],
    recommendations: [
      {
        title: "Verific\u00e1 tu link de reservas",
        description:
          "Confirm\u00e1 que el enlace de Bookido est\u00e9 en tu bio de Instagram.",
        action_label: "Ver mi link",
        action_url: "/settings/booking-link",
        priority: 1,
      },
      {
        title: "Registr\u00e1 servicios manuales",
        description:
          "Si atend\u00e9s clientes por otro canal, registr\u00e1los en el sistema.",
        action_label: "Agregar reserva",
        action_url: "/bookings/new",
        priority: 2,
      },
    ],
    generated_at: "2026-05-25T11:00:00.000Z",
    status: "generated",
    model: "claude-sonnet-4-6",
    cost_usd: 0.01457,
  },
  balance: {
    tenant: "balance-spa",
    tenant_name: "Balance Spa",
    date: "2026-05-25",
    summary:
      "Balance Spa tiene 5 reservas hoy con buen ritmo. Los ingresos del mes van en RD$1,800 con tendencia positiva.",
    alerts: [
      {
        type: "no_show_risk",
        severity: "medium",
        message: "2 reservas pendientes de confirmaci\u00f3n para hoy.",
        suggested_action:
          "Envi\u00e1 recordatorio por WhatsApp a los clientes pendientes.",
      },
    ],
    recommendations: [
      {
        title: "Confirm\u00e1 las 2 reservas pendientes",
        description: "Dos clientes no han confirmado su cita de hoy.",
        action_label: "Ver pendientes",
        action_url: "/panel/reservas",
        priority: 1,
      },
      {
        title: "Public\u00e1 disponibilidad de ma\u00f1ana",
        description:
          "Ten\u00e9s huecos disponibles ma\u00f1ana que podr\u00edas llenar.",
        action_label: "Ver calendario",
        action_url: "/panel/calendario",
        priority: 2,
      },
    ],
    generated_at: "2026-05-25T11:00:00.000Z",
    status: "generated",
    model: "claude-sonnet-4-6",
    cost_usd: 0.01234,
  },
  bookido: {
    tenant: "bookido",
    tenant_name: "Bookido Demo",
    date: "2026-05-25",
    summary:
      "D\u00eda fuerte con 12 reservas. Ingresos del mes en RD$3,200 (+25% vs semana pasada). 4 por confirmar necesitan atenci\u00f3n.",
    alerts: [
      {
        type: "no_show_risk",
        severity: "medium",
        message:
          "4 reservas sin confirmar para hoy. Riesgo de no-show si no se contactan.",
        suggested_action:
          "Envi\u00e1 recordatorios autom\u00e1ticos o confirm\u00e1 manualmente.",
      },
      {
        type: "other",
        severity: "low",
        message:
          "7 clientes nuevos este mes. Tu base est\u00e1 creciendo saludablemente.",
        suggested_action:
          "Considera enviar un mensaje de bienvenida personalizado.",
      },
    ],
    recommendations: [
      {
        title: "Activ\u00e1 recordatorios autom\u00e1ticos",
        description:
          "Reduc\u00ed no-shows con mensajes 24h y 2h antes de la cita.",
        action_label: "Configurar",
        action_url: "/panel/configuracion",
        priority: 1,
      },
      {
        title: "Revis\u00e1 la disponibilidad del fin de semana",
        description:
          "Con 48 reservas esta semana, el fin de semana podr\u00eda saturarse.",
        action_label: "Ver calendario",
        action_url: "/panel/calendario",
        priority: 2,
      },
      {
        title: "Ofrec\u00e9 upgrade a clientes frecuentes",
        description:
          "Tus top 3 clientes podr\u00edan beneficiarse de paquetes o membres\u00edas.",
        action_label: "Ver clientes",
        action_url: "/panel/clientes",
        priority: 3,
      },
    ],
    generated_at: "2026-05-25T11:00:00.000Z",
    status: "generated",
    model: "claude-sonnet-4-6",
    cost_usd: 0.01567,
  },
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export default async function PanelV2PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; tenant?: string; active?: string }>;
}) {
  const params = await searchParams;

  const expectedToken = process.env.PANEL_V2_PREVIEW_TOKEN;
  const enabled = process.env.PANEL_V2_PREVIEW_ENABLED === "true";

  if (!enabled || !expectedToken || params.token !== expectedToken) {
    notFound();
  }

  const tenantKey = params.tenant || "bookido";
  const tenant = MOCK_TENANTS[tenantKey] || MOCK_TENANTS.bookido;
  const activeRoute = params.active || "inicio";

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
        rel="stylesheet"
      />
      <style>{`body { --accent: ${hexToRgb(tenant.accent)}; --accent-hex: ${tenant.accent}; margin: 0; }`}</style>
      <div data-tenant={tenantKey} className="flex h-screen overflow-hidden bg-[var(--ink-950)]">
        <SidebarV2
          tenantSlug={tenantKey}
          tenantName={tenant.name}
          whatsapp={tenant.whatsapp}
          activeRoute={activeRoute}
        />

        <main
          className="flex-1 flex flex-col h-screen overflow-hidden"
          style={{ marginLeft: "var(--sidebar-w)" }}
        >
          {/* QA Banner */}
          <div className="bg-amber-500/20 border-b border-amber-400/30 px-6 py-1.5 text-center shrink-0">
            <span className="text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              ⚠ MODO QA — datos mock — no es panel real
            </span>
          </div>

          {/* Top Stats Bar — 56px */}
          <TopStatsBar />

          {/* Hero Compact — 96px */}
          <HeroCompact
            tenantName={tenant.name}
            tenantSlug={tenantKey}
            accentHex={tenant.accent}
            plan={tenant.plan}
          />

          {/* Metric Row — 100px */}
          <MetricRowCompact metrics={tenant.metrics} accentHex={tenant.accent} />

          {/* Main Stage with AI Card */}
          <div
            className="flex-1 overflow-y-auto border-t border-white/[0.04] p-6"
            style={{ background: "var(--ink-950)" }}
          >
            <div className="max-w-2xl">
              <BookidoAICard
                tenantSlug={tenantKey}
                briefingData={MOCK_BRIEFINGS[tenantKey] || MOCK_BRIEFINGS.bookido}
              />
            </div>
          </div>

          {/* Bottom strip placeholder */}
          <div
            className="h-12 flex items-center justify-center border-t border-white/[0.04] shrink-0"
            style={{ background: "var(--ink-900)" }}
          >
            <p className="text-white/10 text-[10px] uppercase tracking-wider">Batch 4 — Bottom strip</p>
          </div>
        </main>

        {/* Status Sync indicator */}
        <StatusSync />
      </div>
    </>
  );
}
