"use client";

import { useState, useTransition } from "react";
import { updatePlanPriceAction } from "@/app/admin/(panel)/planes/actions";

type Plan = { id: string; name: string; duration_days: number; price_rd: number | null };

export function PlanesClient({ plans }: { plans: Plan[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);

  function startEdit(plan: Plan) {
    setEditing(plan.id);
    setPriceInput(plan.price_rd?.toString() ?? "");
  }

  function handleSave(planId: string) {
    const price = priceInput.trim() === "" ? null : parseInt(priceInput, 10);
    if (priceInput.trim() !== "" && (isNaN(price!) || price! < 0)) return;

    startTransition(async () => {
      await updatePlanPriceAction(planId, price);
      setEditing(null);
      setSavedId(planId);
      setTimeout(() => setSavedId(null), 2000);
    });
  }

  const planMeta: Record<string, { badge: string; desc: string }> = {
    Trimestral: {
      badge: "text-sky-300 bg-sky-500/10 border-sky-400/20",
      desc: "Pago cada 3 meses",
    },
    Semestral: {
      badge: "text-indigo-300 bg-indigo-500/10 border-indigo-400/20",
      desc: "Pago cada 6 meses",
    },
    Anual: {
      badge: "text-violet-300 bg-violet-500/10 border-violet-400/20",
      desc: "Pago anual — mejor valor",
    },
  };

  return (
    <div className="space-y-3">
      {plans.map(plan => {
        const meta = planMeta[plan.name] ?? { badge: "text-zinc-300 bg-zinc-600/10 border-zinc-600/20", desc: "" };
        const isEditing = editing === plan.id;
        const isSaved = savedId === plan.id;
        return (
          <div
            key={plan.id}
            className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-3 py-0.5 text-sm font-medium ${meta.badge}`}>
                  {plan.name}
                </span>
                <div>
                  <p className="text-sm text-zinc-300">{plan.duration_days} días</p>
                  <p className="text-xs text-zinc-600">{meta.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">RD$</span>
                    <input
                      type="number"
                      min={0}
                      value={priceInput}
                      onChange={e => setPriceInput(e.target.value)}
                      placeholder="0"
                      className="w-28 rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/40 text-right"
                      autoFocus
                      onKeyDown={e => { if (e.key === "Enter") handleSave(plan.id); if (e.key === "Escape") setEditing(null); }}
                    />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleSave(plan.id)}
                      className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
                    >
                      {pending ? "…" : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-xl border border-white/[0.07] px-3 py-2 text-sm text-zinc-400 hover:text-white transition"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className={`font-future text-xl font-semibold ${plan.price_rd ? "text-white" : "text-zinc-600"}`}>
                      {plan.price_rd ? `RD$ ${plan.price_rd.toLocaleString()}` : "Sin precio"}
                    </p>
                    <button
                      type="button"
                      onClick={() => startEdit(plan)}
                      className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                        isSaved
                          ? "border-emerald-400/20 text-emerald-400"
                          : "border-white/[0.07] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {isSaved ? "✓ Guardado" : "Editar precio"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
