import "@/styles/tokens.css";
import { SidebarV2 } from "@/components/panel-v2/SidebarV2";
import { TopStatsBar } from "@/components/panel-v2/TopStatsBar";
import { HeroCompact } from "@/components/panel-v2/HeroCompact";
import { MetricRowCompact } from "@/components/panel-v2/MetricRowCompact";
import { StatusSync } from "@/components/panel-v2/StatusSync";
import { BookidoAICard } from "@/components/panel-v2/BookidoAICard";
import type { MetricCard } from "@/components/panel-v2/MetricRowCompact";
import { getTenantSlug } from "@/lib/tenant";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Panel V2 \u2014 Bookido",
};

async function getTenantData(slug: string) {
  const admin = createServiceSupabaseClient();
  if (!admin) return null;
  const { data } = await admin
    .from("tenants")
    .select("slug, name, whatsapp, color_primary")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

const PLACEHOLDER_METRICS: MetricCard[] = [
  { label: "Reservas hoy", value: "\u2014", trend: "", trendUp: true, icon: "\ud83d\udcc5", sparkline: [0, 0, 0, 0, 0] },
  { label: "Esta semana", value: "\u2014", trend: "", trendUp: true, icon: "\ud83d\udcca", sparkline: [0, 0, 0, 0, 0] },
  { label: "Ingresos mes", value: "\u2014", trend: "", trendUp: true, icon: "\ud83d\udcb0", sparkline: [0, 0, 0, 0, 0] },
  { label: "Por confirmar", value: "\u2014", trend: "", trendUp: true, icon: "\u23f3", sparkline: [0, 0, 0, 0, 0] },
  { label: "Clientes nuevos", value: "\u2014", trend: "", trendUp: true, icon: "\ud83d\udc64", sparkline: [0, 0, 0, 0, 0] },
];

export default async function PanelV2Page() {
  let tenantSlug = "bookido";
  let whatsapp = "";
  let tenantName = "Demo";
  let accentHex = "#00F8A0";

  try {
    tenantSlug = await getTenantSlug();
    const data = await getTenantData(tenantSlug);
    if (data) {
      whatsapp = data.whatsapp || "";
      tenantName = data.name || tenantSlug;
      accentHex = data.color_primary || "#00F8A0";
    }
  } catch {
    // Demo mode \u2014 use defaults
  }

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body { --accent: ${hexToRgb(accentHex)}; --accent-hex: ${accentHex}; margin: 0; }
      `}</style>
      <div data-tenant={tenantSlug} className="flex h-screen overflow-hidden bg-[var(--ink-950)]">
        <SidebarV2 tenantSlug={tenantSlug} tenantName={tenantName} whatsapp={whatsapp} />
        <main
          className="flex-1 flex flex-col h-screen overflow-hidden"
          style={{ marginLeft: "var(--sidebar-w)" }}
        >
          <TopStatsBar />
          <HeroCompact
            tenantName={tenantName}
            tenantSlug={tenantSlug}
            accentHex={accentHex}
            plan="Plan Fundador"
          />
          <MetricRowCompact metrics={PLACEHOLDER_METRICS} accentHex={accentHex} />

          {/* Main Stage with AI Card */}
          <div
            className="flex-1 overflow-y-auto border-t border-white/[0.04] p-6"
            style={{ background: "var(--ink-950)" }}
          >
            <div className="max-w-2xl">
              <BookidoAICard tenantSlug={tenantSlug} />
            </div>
          </div>

          {/* Bottom strip */}
          <div
            className="h-12 flex items-center justify-center border-t border-white/[0.04] shrink-0"
            style={{ background: "var(--ink-900)" }}
          >
            <p className="text-white/10 text-[10px] uppercase tracking-wider">Bookido \u00b7 {tenantSlug}</p>
          </div>
        </main>

        <StatusSync />
      </div>
    </>
  );
}
