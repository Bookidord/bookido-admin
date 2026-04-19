import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

function daysRemaining(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + "T00:00:00");
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminDashboard() {
  const admin = createServiceSupabaseClient();
  const today = new Date().toISOString().split("T")[0];
  const week7 = addDays(new Date(), 7).toISOString().split("T")[0];

  let totalActivos = 0;
  let expiringSoon = 0;
  let suspendidos = 0;
  let ingresosEsteMes = 0;
  const alertRows: {
    slug: string;
    business_name: string;
    plan_name: string;
    end_date: string;
    subscription_id: string;
    days: number;
  }[] = [];

  if (admin) {
    const [
      { data: subs },
      { data: plans },
      { data: tenants },
      { data: config },
    ] = await Promise.all([
      admin.from("bookido_subscriptions").select("id, tenant_slug, plan_id, end_date, status"),
      admin.from("bookido_plans").select("id, name, duration_days, price_rd"),
      admin.from("tenants").select("slug, business_name"),
      admin.from("bookido_admin_config").select("alert_days").eq("id", 1).single(),
    ]);

    const alertDays: number = (config as { alert_days?: number } | null)?.alert_days ?? 15;
    const alertCutoff = addDays(new Date(), alertDays).toISOString().split("T")[0];

    const planMap: Record<string, { name: string; price_rd: number | null }> = {};
    plans?.forEach(p => { planMap[p.id] = { name: p.name, price_rd: p.price_rd }; });

    const tenantMap: Record<string, string> = {};
    tenants?.forEach(t => { tenantMap[t.slug] = t.business_name; });

    subs?.forEach(s => {
      if (s.status === "suspended") { suspendidos++; return; }
      if (s.end_date < today) return; // expired, skip

      totalActivos++;
      if (s.end_date <= week7) expiringSoon++;

      // Income: count active subscription's plan price
      const price = planMap[s.plan_id]?.price_rd ?? 0;
      ingresosEsteMes += price;

      // Alert list
      if (s.end_date <= alertCutoff) {
        alertRows.push({
          slug: s.tenant_slug,
          business_name: tenantMap[s.tenant_slug] ?? s.tenant_slug,
          plan_name: planMap[s.plan_id]?.name ?? "—",
          end_date: s.end_date,
          subscription_id: s.id,
          days: daysRemaining(s.end_date),
        });
      }
    });

    alertRows.sort((a, b) => a.days - b.days);
  }

  const stats = [
    { label: "Clientes activos", value: totalActivos, accent: "emerald" },
    {
      label: "Vencen esta semana",
      value: expiringSoon,
      accent: expiringSoon > 0 ? "red" : "zinc",
    },
    {
      label: "Ingresos este mes",
      value: ingresosEsteMes > 0 ? `RD$ ${ingresosEsteMes.toLocaleString()}` : "—",
      accent: "indigo",
    },
    { label: "Suspendidos", value: suspendidos, accent: suspendidos > 0 ? "amber" : "zinc" },
  ];

  const accentMap: Record<string, string> = {
    emerald: "text-[#14F195]",
    red: "text-red-400",
    indigo: "text-indigo-300",
    amber: "text-amber-300",
    zinc: "text-zinc-500",
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-8">
        <p className="text-xs font-medium text-zinc-500">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        </p>
        <h1 className="mt-1 font-future text-2xl font-semibold text-white md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Resumen de clientes y suscripciones.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">{s.label}</p>
            <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${accentMap[s.accent]}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Alert section */}
      <div className="rounded-xl border border-white/[0.07] bg-ink-900/40">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <h2 className="font-future text-base font-semibold text-white">
            Vencimientos próximos
          </h2>
          <Link
            href="/admin/clientes"
            className="text-xs text-indigo-300/70 transition hover:text-indigo-200"
          >
            Ver todos →
          </Link>
        </div>

        {alertRows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-2xl">✅</p>
            <p className="mt-3 text-sm text-zinc-500">
              No hay suscripciones por vencer pronto.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {alertRows.map(row => (
              <li
                key={row.subscription_id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-100">{row.business_name}</p>
                  <p className="text-xs text-zinc-600 font-mono">{row.slug}.bookido.online</p>
                </div>
                <div className="flex items-center gap-3 sm:ml-auto">
                  <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-300">
                    {row.plan_name}
                  </span>
                  <span
                    className={`min-w-[80px] text-right text-sm font-semibold tabular-nums ${
                      row.days <= 0
                        ? "text-red-400"
                        : row.days <= 5
                        ? "text-red-300"
                        : "text-amber-300"
                    }`}
                  >
                    {row.days <= 0
                      ? "Expirado"
                      : row.days === 1
                      ? "1 día"
                      : `${row.days} días`}
                  </span>
                  <Link
                    href="/admin/clientes"
                    className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300 transition hover:bg-indigo-500/20"
                  >
                    Renovar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
