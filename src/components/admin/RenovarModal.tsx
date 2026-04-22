"use client";

import { useState, useTransition } from "react";
import { renovarAction } from "@/app/admin/(panel)/clientes/actions";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

type Plan = { id: string; name: string; duration_days: number; price_rd: number | null };

interface Props {
  subscriptionId: string;
  currentEndDate: string;
  currentPlanId: string;
  businessName: string;
  plans: Plan[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RenovarModal({
  subscriptionId,
  currentEndDate,
  currentPlanId,
  businessName,
  plans,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState(currentPlanId);
  const [from, setFrom] = useState<"today" | "expiry">("expiry");

  const selectedPlan = plans.find(p => p.id === planId);
  const baseDate = from === "today"
    ? new Date().toISOString().split("T")[0]
    : currentEndDate;
  const newEndDate = selectedPlan
    ? addDays(new Date(baseDate), selectedPlan.duration_days).toISOString().split("T")[0]
    : "—";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await renovarAction({
        subscription_id: subscriptionId,
        plan_id: planId,
        from,
        current_end_date: currentEndDate,
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-ink-900 p-6 shadow-2xl">
        <button type="button" onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 hover:text-white transition">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-1 font-future text-lg font-semibold text-white">Renovar suscripción</h2>
        <p className="mb-5 text-sm text-zinc-500">{businessName}</p>

        <div className="mb-5 rounded-xl border border-white/[0.06] bg-ink-950/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Vencimiento actual</span>
            <span className="font-mono text-zinc-300">
              {format(new Date(currentEndDate + "T00:00:00"), "d MMM yyyy", { locale: es })}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Plan</label>
            <select
              value={planId} onChange={e => setPlanId(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/40"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.duration_days} días{p.price_rd ? ` — RD$ ${p.price_rd.toLocaleString()}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Iniciar renovación desde</label>
            <div className="flex gap-2">
              {(["expiry", "today"] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFrom(opt)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm transition ${
                    from === opt
                      ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-300"
                      : "border-white/[0.07] text-zinc-400 hover:text-white"
                  }`}
                >
                  {opt === "expiry" ? "Desde vencimiento" : "Desde hoy"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              {from === "expiry"
                ? "Extiende sin saltos — ideal si el cliente pagó a tiempo."
                : "Inicia hoy — ideal si hubo un gap o el cliente pagó tarde."}
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-indigo-400/15 bg-indigo-500/5 px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Nuevo vencimiento</span>
              <span className="font-mono font-semibold text-indigo-300">
                {newEndDate !== "—"
                  ? format(new Date(newEndDate + "T00:00:00"), "d MMM yyyy", { locale: es })
                  : "—"}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/[0.07] py-2.5 text-sm text-zinc-400 hover:text-white transition">
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50">
              {pending ? "Renovando…" : "Confirmar renovación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
