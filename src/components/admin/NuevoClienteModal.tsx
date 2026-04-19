"use client";

import { useState, useTransition, useId } from "react";
import { crearClienteAction } from "@/app/admin/(panel)/clientes/actions";

type Plan = { id: string; name: string; duration_days: number; price_rd: number | null };

interface Props {
  plans: Plan[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export function NuevoClienteModal({ plans, open, onClose, onSuccess }: Props) {
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  function handleBizName(val: string) {
    setBusinessName(val);
    if (!slugEdited) setSlug(toSlug(val));
  }

  function handleSlug(val: string) {
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"));
    setSlugEdited(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await crearClienteAction({
        business_name: businessName,
        slug,
        email,
        password,
        plan_id: planId,
        start_date: startDate,
        notes,
      });
      if (res.ok) {
        setSuccess(res.subdomain);
      } else {
        setError(res.error);
      }
    });
  }

  function handleClose() {
    setBusinessName(""); setSlug(""); setSlugEdited(false);
    setEmail(""); setPassword(""); setNotes("");
    setPlanId(plans[0]?.id ?? "");
    setStartDate(new Date().toISOString().split("T")[0]);
    setError(null); setSuccess(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-ink-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 hover:text-white transition"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-5 font-future text-lg font-semibold text-white">
          Nuevo cliente
        </h2>

        {success ? (
          <div className="text-center py-4">
            <div className="mb-4 text-4xl">🎉</div>
            <p className="font-medium text-white">¡Cliente creado!</p>
            <div className="my-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-xs text-zinc-500">Panel del cliente:</p>
              <p className="font-mono text-sm text-emerald-300 break-all">{success}/panel</p>
            </div>
            <button
              type="button"
              onClick={() => { handleClose(); onSuccess(); }}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-400">Nombre del negocio</label>
                <input
                  type="text" required value={businessName}
                  onChange={e => handleBizName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-400">Subdominio</label>
                <div className="flex items-center overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950/60 focus-within:border-indigo-400/40">
                  <input
                    type="text" required value={slug}
                    onChange={e => handleSlug(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
                  />
                  <span className="pr-3 text-xs text-zinc-600">.bookido.online</span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  Panel: <span className="text-zinc-400 font-mono">{slug || "…"}.bookido.online/panel</span>
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Email del dueño</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Contraseña inicial</label>
                <input
                  type="text" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres"
                  className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Plan</label>
                <select
                  value={planId} onChange={e => setPlanId(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/40"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.duration_days}d)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Fecha de inicio</label>
                <input
                  type="date" required value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/40"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-400">Notas (opcional)</label>
                <input
                  type="text" value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observaciones internas…"
                  className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/40"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleClose}
                className="flex-1 rounded-xl border border-white/[0.07] py-2.5 text-sm text-zinc-400 hover:text-white transition">
                Cancelar
              </button>
              <button type="submit" disabled={pending}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50">
                {pending ? "Creando…" : "Crear cliente"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
