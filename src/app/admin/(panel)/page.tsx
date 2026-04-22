import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getCounts() {
  const admin = createServiceSupabaseClient();
  if (!admin) return { total: 0, active: 0, inactive: 0 };

  const { count } = await admin
    .from("tenants")
    .select("slug", { count: "exact", head: true });

  const total = count ?? 0;
  return { total, active: total, inactive: 0 };
}

export default async function AdminDashboard() {
  const counts = await getCounts();

  const stats = [
    {
      label: "Clientes activos",
      value: counts.active,
      sub: `${counts.total} en total`,
      accent: "emerald",
    },
    {
      label: "Vencen esta semana",
      value: "—",
      sub: "Próximamente",
      accent: "zinc",
    },
    {
      label: "Ingresos este mes",
      value: "—",
      sub: "Próximamente",
      accent: "zinc",
    },
    {
      label: "Suspendidos",
      value: counts.inactive,
      sub: "negocios inactivos",
      accent: counts.inactive > 0 ? "amber" : "zinc",
    },
  ];

  const accentMap: Record<string, string> = {
    emerald: "text-[#14F195]",
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
          Resumen de clientes y estado del sistema.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">{s.label}</p>
            <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${accentMap[s.accent]}`}>
              {s.value}
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Subscription metrics notice */}
      <div className="mb-8 flex items-center gap-3 rounded-xl border border-indigo-400/15 bg-indigo-500/[0.06] px-5 py-4">
        <span className="text-indigo-400">ℹ</span>
        <p className="text-sm text-indigo-300/70">
          Métricas de suscripción disponibles próximamente — ingresos, vencimientos y renovaciones se activarán al integrar el módulo de pagos.
        </p>
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-white/[0.07] bg-ink-900/40">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <h2 className="font-future text-base font-semibold text-white">
            Accesos rápidos
          </h2>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {[
            { href: "/admin/clientes", label: "Ver clientes", desc: `${counts.total} negocios registrados` },
            { href: "/admin/planes", label: "Gestionar planes", desc: "Precios y configuración" },
            { href: "/admin/configuracion", label: "Estado del sistema", desc: "PM2, APIs, DB" },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-4 transition hover:border-white/[0.12] hover:bg-ink-900/60"
            >
              <p className="text-sm font-medium text-zinc-100">{link.label}</p>
              <p className="mt-1 text-xs text-zinc-600">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
