import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { TopStatsBar } from "@/components/panel-v2/TopStatsBar";
import { HeroCompact } from "@/components/panel-v2/HeroCompact";
import { MetricRowCompact } from "@/components/panel-v2/MetricRowCompact";
import { BookidoAICard } from "@/components/panel-v2/BookidoAICard";
import type { MetricCard } from "@/components/panel-v2/MetricRowCompact";
import Link from "next/link";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function PanelHomePage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  // Tenant data
  let tenantName = tenant;
  let accentHex = "#00F8A0";
  if (admin) {
    const { data: t } = await admin
      .from("tenants")
      .select("name, settings")
      .eq("slug", tenant)
      .maybeSingle();
    if (t) {
      tenantName = t.name || tenant;
      accentHex = t.settings?.accent || "#00F8A0";
    }
  }

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  let reservasHoy = 0;
  let reservasSemana = 0;
  let ingresosHoy = 0;
  let porConfirmar = 0;
  let clientesNuevos = 0;
  let todayBookings: { id: string; starts_at: string; customer_name: string; service_name: string; status: string }[] = [];

  if (admin) {
    // Reservas hoy
    const { count: hoyCount } = await admin
      .from("bookido_bookings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", tenant)
      .gte("starts_at", todayStart)
      .lte("starts_at", todayEnd);
    reservasHoy = hoyCount ?? 0;

    // Reservas semana
    const { count: semanaCount } = await admin
      .from("bookido_bookings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", tenant)
      .gte("starts_at", weekStart)
      .lte("starts_at", weekEnd);
    reservasSemana = semanaCount ?? 0;

    // Por confirmar
    const { count: pendCount } = await admin
      .from("bookido_bookings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", tenant)
      .eq("status", "pending")
      .gte("starts_at", todayStart);
    porConfirmar = pendCount ?? 0;

    // Clientes nuevos este mes
    const { count: newClients } = await admin
      .from("bookido_customers")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", tenant)
      .gte("created_at", monthStart);
    clientesNuevos = newClients ?? 0;

    // Today's bookings for agenda
    const { data: todayData } = await admin
      .from("bookido_bookings")
      .select("id, starts_at, customer_name, service_id, status")
      .eq("tenant_slug", tenant)
      .gte("starts_at", todayStart)
      .lte("starts_at", todayEnd)
      .order("starts_at", { ascending: true });

    const { data: services } = await admin
      .from("bookido_services")
      .select("id, name")
      .eq("tenant_slug", tenant);

    const svcMap: Record<string, string> = {};
    services?.forEach((s) => { svcMap[s.id] = s.name; });

    todayBookings = (todayData ?? []).map((b) => ({
      id: b.id,
      starts_at: b.starts_at,
      customer_name: b.customer_name,
      service_name: b.service_id ? (svcMap[b.service_id] ?? "—") : "—",
      status: b.status,
    }));
  }

  const metrics: MetricCard[] = [
    { label: "Reservas hoy", value: String(reservasHoy), trend: "", trendUp: true, icon: "\ud83d\udcc5", sparkline: [0, 0, 0, 0, reservasHoy] },
    { label: "Esta semana", value: String(reservasSemana), trend: "", trendUp: true, icon: "\ud83d\udcca", sparkline: [0, 0, 0, 0, reservasSemana] },
    { label: "Ingresos hoy", value: ingresosHoy > 0 ? `RD$${ingresosHoy.toLocaleString()}` : "RD$0", trend: "", trendUp: true, icon: "\ud83d\udcb0", sparkline: [0, 0, 0, 0, 0] },
    { label: "Por confirmar", value: String(porConfirmar), trend: "", trendUp: false, icon: "\u23f3", sparkline: [0, 0, 0, 0, porConfirmar] },
    { label: "Clientes nuevos", value: String(clientesNuevos), trend: "", trendUp: true, icon: "\ud83d\udc64", sparkline: [0, 0, 0, 0, clientesNuevos] },
  ];

  const statusColors: Record<string, string> = {
    confirmed: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-amber-500/10 text-amber-400",
    cancelled: "bg-red-500/10 text-red-400",
    completed: "bg-blue-500/10 text-blue-400",
    no_show: "bg-zinc-500/10 text-zinc-400",
  };

  const statusLabels: Record<string, string> = {
    confirmed: "Confirmada",
    pending: "Pendiente",
    cancelled: "Cancelada",
    completed: "Completada",
    no_show: "No-show",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Stats Bar */}
      <TopStatsBar />

      {/* Hero Compact */}
      <HeroCompact
        tenantName={tenantName}
        tenantSlug={tenant}
        accentHex={accentHex}
        plan="Plan Fundador"
      />

      {/* Metric Row */}
      <MetricRowCompact metrics={metrics} accentHex={accentHex} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agenda de hoy — 2 cols */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "var(--ink-900)" }}>
            <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Agenda de hoy</h2>
              <Link href="/panel/reservas" className="text-xs text-white/30 hover:text-white/60 transition">
                Ver todas →
              </Link>
            </div>
            {todayBookings.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-2xl">\ud83d\udccb</p>
                <p className="mt-3 text-sm text-white/30">No hay reservas para hoy.</p>
                <p className="text-xs text-white/15 mt-1">Las nuevas reservas aparecerán aquí automáticamente.</p>
              </div>
            ) : (
              todayBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.03] last:border-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "rgb(var(--accent) / 0.15)", color: "var(--accent-hex)" }}
                  >
                    {b.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{b.customer_name}</p>
                    <p className="text-xs text-white/40">{b.service_name} · {format(new Date(b.starts_at), "h:mm a", { locale: es })}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusColors[b.status] || "bg-zinc-500/10 text-zinc-400"}`}>
                    {statusLabels[b.status] || b.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* AI Co-pilot card — 1 col */}
          <div className="lg:col-span-1">
            <BookidoAICard tenantSlug={tenant} />
          </div>
        </div>
      </div>

    </div>
  );
}
