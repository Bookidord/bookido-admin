"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NuevoClienteModal } from "./NuevoClienteModal";
import { RenovarModal } from "./RenovarModal";
import { suspenderAction } from "@/app/admin/(panel)/clientes/actions";
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
};

interface Props {
  clientes: ClienteRow[];
  plans: Plan[];
}

function daysRemaining(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + "T00:00:00");
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ row }: { row: ClienteRow }) {
  if (!row.subscription_id || !row.end_date)
    return <span className="rounded-full bg-zinc-600/20 px-2.5 py-0.5 text-xs text-zinc-400">Sin plan</span>;

  if (row.sub_status === "suspended")
    return <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2.5 py-0.5 text-xs text-zinc-400">Suspendido</span>;

  const days = daysRemaining(row.end_date);
  if (days < 0)
    return <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-400">Expirado</span>;
  if (days <= 5)
    return <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-300">Vence en {days}d</span>;
  if (days <= 15)
    return <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">Vence en {days}d</span>;
  return <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">Activo</span>;
}

function PlanBadge({ name }: { name: string | null }) {
  if (!name) return <span className="text-zinc-600">—</span>;
  const color =
    name === "Anual" ? "text-violet-300 bg-violet-500/10 border-violet-400/20" :
    name === "Semestral" ? "text-indigo-300 bg-indigo-500/10 border-indigo-400/20" :
    "text-sky-300 bg-sky-500/10 border-sky-400/20";
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs ${color}`}>{name}</span>;
}

export function ClientesTable({ clientes, plans }: Props) {
  const router = useRouter();
  const [showNuevo, setShowNuevo] = useState(false);
  const [renovarRow, setRenovarRow] = useState<ClienteRow | null>(null);
  const [suspendPending, startSuspend] = useTransition();
  const [suspendingId, setSuspendingId] = useState<string | null>(null);

  function handleSuspend(row: ClienteRow, suspend: boolean) {
    if (!row.subscription_id) return;
    setSuspendingId(row.subscription_id);
    startSuspend(async () => {
      await suspenderAction(row.subscription_id!, suspend);
      setSuspendingId(null);
      router.refresh();
    });
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-future text-2xl font-semibold text-white">Clientes</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{clientes.length} negocio{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNuevo(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo cliente
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-900/40">
        {clientes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl">🏪</p>
            <p className="mt-3 text-sm text-zinc-500">No hay clientes aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Negocio", "Plan", "Vence", "Estado", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map(row => {
                  const days = row.end_date ? daysRemaining(row.end_date) : null;
                  const isSuspending = suspendPending && suspendingId === row.subscription_id;
                  return (
                    <tr key={row.slug} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-zinc-100">{row.business_name}</p>
                        <p className="text-xs text-zinc-600 font-mono">{row.slug}.bookido.online</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <PlanBadge name={row.plan_name} />
                      </td>
                      <td className="px-4 py-3.5">
                        {row.end_date ? (
                          <div>
                            <p className="text-sm text-zinc-300 font-mono">
                              {format(new Date(row.end_date + "T00:00:00"), "d MMM yyyy", { locale: es })}
                            </p>
                            {days !== null && (
                              <p className={`text-xs ${days < 0 ? "text-red-400" : days <= 5 ? "text-red-300" : days <= 15 ? "text-amber-300" : "text-zinc-600"}`}>
                                {days < 0 ? `Vencido hace ${Math.abs(days)}d` : days === 0 ? "Vence hoy" : `${days}d restantes`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
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
                            href={`/admin/clientes/${row.slug}/landing`}
                            className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300 transition hover:bg-violet-500/20"
                          >
                            Landing
                          </a>
                          <a
                            href={`https://${row.slug}.bookido.online/panel`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-white/[0.07] px-2.5 py-1 text-xs text-zinc-400 transition hover:text-white"
                          >
                            Ver panel ↗
                          </a>
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
