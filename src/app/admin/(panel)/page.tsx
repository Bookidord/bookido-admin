import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getStats() {
  const admin = createServiceSupabaseClient();
  if (!admin) return { total: 0, suspended: 0, expiringWeek: 0, bookingsMonth: 0, bookingsToday: 0, recentBookings: [] as RecentBooking[] };

  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(now.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const [
    tenantsRes, subsRes, bookingsMonthRes, bookingsTodayRes, recentRes, tenantsMapRes,
  ] = await Promise.all([
    admin.from("tenants").select("slug", { count: "exact", head: true }),
    admin.from("bookido_subscriptions").select("status, end_date"),
    admin.from("bookido_bookings").select("id", { count: "exact", head: true })
      .gte("starts_at", monthStart.toISOString()),
    admin.from("bookido_bookings").select("id", { count: "exact", head: true })
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString()),
    admin.from("bookido_bookings")
      .select("id, starts_at, customer_name, status, tenant_slug")
      .order("starts_at", { ascending: false })
      .limit(8),
    admin.from("tenants").select("slug, name"),
  ]);

  const subs = subsRes.data ?? [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const suspended = subs.filter(s => s.status === "suspended").length;
  const expiringWeek = subs.filter(s => {
    if (s.status === "suspended" || !s.end_date) return false;
    const end = new Date(s.end_date + "T00:00:00");
    const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 7;
  }).length;

  const tenantNameMap: Record<string, string> = {};
  (tenantsMapRes.data ?? []).forEach(t => { tenantNameMap[t.slug] = t.name; });

  type RecentBooking = {
    id: string;
    starts_at: string;
    customer_name: string;
    status: string;
    tenant_slug: string;
    tenant_name: string;
  };

  const recentBookings: RecentBooking[] = (recentRes.data ?? []).map(b => ({
    ...b,
    tenant_name: tenantNameMap[b.tenant_slug] ?? b.tenant_slug,
  }));

  return {
    total: tenantsRes.count ?? 0,
    suspended,
    expiringWeek,
    bookingsMonth: bookingsMonthRes.count ?? 0,
    bookingsToday: bookingsTodayRes.count ?? 0,
    recentBookings,
  };
}

type RecentBooking = {
  id: string;
  starts_at: string;
  customer_name: string;
  status: string;
  tenant_slug: string;
  tenant_name: string;
};

const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-emerald-400",
  completed: "bg-blue-400",
  cancelled: "bg-zinc-500",
  no_show:   "bg-amber-400",
};

function parseDate(iso: string) { return new Date(iso.replace(" ", "T")); }

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Negocios activos",    value: stats.total,          sub: "tenants registrados",            accent: "emerald" },
    { label: "Vencen esta semana",  value: stats.expiringWeek,   sub: stats.expiringWeek > 0 ? "renovar pronto" : "todo en orden", accent: stats.expiringWeek > 0 ? "amber" : "zinc" },
    { label: "Reservas este mes",   value: stats.bookingsMonth,  sub: `${stats.bookingsToday} hoy`,     accent: "indigo" },
    { label: "Suspendidos",         value: stats.suspended,      sub: "negocios sin acceso",            accent: stats.suspended > 0 ? "red" : "zinc" },
  ];

  const accentMap: Record<string, string> = {
    emerald: "text-[#14F195]",
    amber:   "text-amber-300",
    indigo:  "text-indigo-300",
    red:     "text-red-400",
    zinc:    "text-zinc-500",
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-8">
        <p className="text-xs font-medium text-zinc-500">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        </p>
        <h1 className="mt-1 font-future text-2xl font-semibold text-white md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Resumen global de la plataforma.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">{s.label}</p>
            <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${accentMap[s.accent]}`}>
              {s.value}
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent bookings */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-ink-900/40">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
            <h2 className="font-future text-sm font-semibold text-white">Últimas reservas</h2>
            <span className="text-[10px] text-zinc-600">todos los negocios</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {stats.recentBookings.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-600">Sin reservas aún.</p>
            ) : (
              stats.recentBookings.map(b => {
                const d = parseDate(b.starts_at);
                return (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[b.status] ?? "bg-zinc-500"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-200 truncate">{b.customer_name}</p>
                      <p className="text-xs text-zinc-600 truncate">{b.tenant_name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-xs text-zinc-400">{format(d, "HH:mm")}</p>
                      <p className="text-[10px] text-zinc-600">{format(d, "d MMM", { locale: es })}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40">
          <div className="border-b border-white/[0.07] px-5 py-3.5">
            <h2 className="font-future text-sm font-semibold text-white">Accesos rápidos</h2>
          </div>
          <div className="flex flex-col gap-2 p-4">
            {[
              { href: "/admin/clientes",      label: "Gestionar clientes",   desc: `${stats.total} negocios`,         icon: "🏪" },
              { href: "/admin/planes",         label: "Planes y precios",     desc: "Editar planes activos",           icon: "💳" },
              { href: "/admin/configuracion",  label: "Estado del sistema",   desc: "PM2, APIs, DB",                   icon: "⚙" },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-ink-950/40 p-3.5 transition hover:border-white/[0.12] hover:bg-ink-900/60"
              >
                <span className="text-lg">{link.icon}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{link.label}</p>
                  <p className="text-xs text-zinc-600">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
