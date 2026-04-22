"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NuevoClienteModal } from "./NuevoClienteModal";
import { RenovarModal } from "./RenovarModal";
import { suspenderAction, impersonarAction } from "@/app/admin/(panel)/clientes/actions";
import { useRouter } from "next/navigation";

type Plan = { id: string; name: string; duration_days: number; price_rd: number | null };

type ClienteRow = {
  slug: string;
  business_name: string;
  email: string;
  subscription_id: string | null;
  plan_id: string | null;
  plan_name: string | null;
  start_date: string | null;
  end_date: string | null;
  sub_status: string | null;
  is_active?: boolean;
  is_test?: boolean;
  owner_phone?: string | null;
  service_count?: number;
  booking_count_30d?: number;
  created_at?: string | null;
};

interface Props {
  clientes: ClienteRow[];
  plans: Plan[];
}

function StatusBadge({ row }: { row: ClienteRow }) {
  if (row.is_test)
    return <span className="rounded-full bg-zinc-600/20 px-2.5 py-0.5 text-xs text-zinc-500">Test</span>;
  if (row.is_active === false)
    return <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2.5 py-0.5 text-xs text-zinc-400">Inactivo</span>;
  if (!row.subscription_id)
    return <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">Activo</span>;

  if (row.sub_status === "suspended")
    return <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2.5 py-0.5 text-xs text-zinc-400">Suspendido</span>;

  if (row.end_date) {
    const today = new Date(); today.setHours(0,0,0,0);
    const end = new Date(row.end_date + "T00:00:00");
    const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
    if (days < 0) return <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-400">Expirado</span>;
    if (days <= 5) return <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-300">Vence {days}d</span>;
    if (days <= 15) return <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">Vence {days}d</span>;
    return <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">Activo</span>;
  }
  return <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">Activo</span>;
}

export function ClientesTable({ clientes, plans }: Props) {
  const router = useRouter();
  const [showNuevo, setShowNuevo] = useState(false);
  const [renovarRow, setRenovarRow] = useState<ClienteRow | null>(null);
  const [suspendPending, startSuspend] = useTransition();
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [hideTest, setHideTest] = useState(false);
  const [search, setSearch] = useState("");
  const [impersonating, setImpersonating] = useState<string | null>(null);

  function handleSuspend(row: ClienteRow, suspend: boolean) {
    if (!row.subscription_id) return;
    setSuspendingId(row.subscription_id);
    startSuspend(async () => {
      await suspenderAction(row.subscription_id!, suspend);
      setSuspendingId(null);
      router.refresh();
    });
  }

  const filtered = clientes.filter(row => {
    if (hideTest && row.is_test) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        row.slug.includes(q) ||
        row.business_name.toLowerCase().includes(q) ||
        (row.email ?? "").toLowerCase().includes(q) ||
        (row.owner_phone ?? "").includes(q)
      );
    }
    return true;
  });

  const realCount = clientes.filter(r => !r.is_test && r.is_active !== false).length;
  const testCount = clientes.filter(r => r.is_test).length;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-future text-2xl font-semibold text-white">Clientes</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {realCount} real{realCount !== 1 ? "es" : ""} · {testCount} en prueba
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar slug, email, teléfono…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-52 rounded-xl border border-white/[0.07] bg-ink-950/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
          />
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500 select-none">
            <input
              type="checkbox"
              checked={hideTest}
              onChange={e => setHideTest(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-indigo-500"
            />
            Ocultar test
          </label>
          <button
            type="button"
            onClick={() => setShowNuevo(true)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-900/40">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl">🏪</p>
            <p className="mt-3 text-sm text-zinc-500">
              {search ? "Sin resultados." : "No hay clientes aún."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Negocio", "Contacto", "Servicios / Reservas", "Estado", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const isSuspending = suspendPending && suspendingId === row.subscription_id;
                  return (
                    <tr key={row.slug} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${row.is_test ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-zinc-100">{row.business_name}</p>
                        <p className="text-xs text-zinc-600 font-mono">{row.slug}.bookido.online</p>
                        {row.created_at && (
                          <p className="text-[10px] text-zinc-700 mt-0.5">
                            {format(new Date(row.created_at), "d MMM yyyy", { locale: es })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-zinc-400">{row.email || <span className="text-zinc-700">—</span>}</p>
                        {row.owner_phone && (
                          <p className="text-xs text-zinc-600 font-mono">{row.owner_phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-zinc-400 font-mono">
                          {row.service_count ?? 0} svc · {row.booking_count_30d ?? 0} rsv/30d
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge row={row} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {row.subscription_id && (
                            <button
                              type="button"
                              onClick={() => setRenovarRow(row)}
                              className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300 transition hover:bg-indigo-500/20"
                            >
                              Renovar
                            </button>
                          )}
                          {row.subscription_id && row.sub_status !== "suspended" ? (
                            <button
                              type="button"
                              disabled={isSuspending}
                              onClick={() => handleSuspend(row, true)}
                              className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
                            >
                              {isSuspending ? "…" : "Suspender"}
                            </button>
                          ) : row.sub_status === "suspended" ? (
                            <button
                              type="button"
                              disabled={isSuspending}
                              onClick={() => handleSuspend(row, false)}
                              className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              {isSuspending ? "…" : "Activar"}
                            </button>
                          ) : null}
                          <a
                            href={`https://${row.slug}.bookido.online`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300 transition hover:bg-violet-500/20"
                          >
                            Ver landing ↗
                          </a>
                          <a
                            href={`/admin/clientes/${row.slug}/landing`}
                            className="rounded-lg border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-xs text-fuchsia-300 transition hover:bg-fuchsia-500/20"
                          >
                            Configurar
                          </a>
                          <button
                            type="button"
                            disabled={impersonating === row.slug}
                            onClick={async () => {
                              setImpersonating(row.slug);
                              const win = window.open("", "_blank");
                              const res = await impersonarAction(row.slug);
                              setImpersonating(null);
                              if (res.ok && win) win.location.href = res.url;
                              else { win?.close(); alert(res.ok ? "Error" : res.error); }
                            }}
                            className="rounded-lg border border-white/[0.07] px-2.5 py-1 text-xs text-zinc-400 transition hover:text-white disabled:opacity-50"
                          >
                            {impersonating === row.slug ? "…" : "Ver ↗"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <NuevoClienteModal
        plans={plans}
        open={showNuevo}
        onClose={() => setShowNuevo(false)}
        onSuccess={() => router.refresh()}
      />
      {renovarRow && (
        <RenovarModal
          subscriptionId={renovarRow.subscription_id!}
          currentEndDate={renovarRow.end_date!}
          currentPlanId={renovarRow.plan_id ?? plans[0]?.id ?? ""}
          businessName={renovarRow.business_name}
          plans={plans}
          open={true}
          onClose={() => setRenovarRow(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
