"use client";

import { useState, useTransition } from "react";
import {
  toggleServiceAction,
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
  reorderServiceAction,
} from "@/app/panel/servicios/actions";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number;
  active: boolean;
  sort_order: number;
};

type FormState = {
  mode: "create" | "edit";
  service?: Service;
} | null;

// ─── Small inline form ────────────────────────────────────────────────────────
function ServiceForm({
  initial,
  onClose,
  nextOrder,
}: {
  initial?: Service;
  onClose: () => void;
  nextOrder: number;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [duration, setDuration] = useState(String(initial?.duration_minutes ?? 60));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        name,
        description: description.trim() || null,
        price: price ? parseFloat(price) : null,
        duration_minutes: parseInt(duration, 10),
        sort_order: initial?.sort_order ?? nextOrder,
      };
      const res = initial
        ? await updateServiceAction(initial.id, payload)
        : await createServiceAction(payload);

      if (!res.ok) { setError(res.error); return; }
      onClose();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-[#14F195]/15 bg-[#14F195]/[0.04] p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold text-white">
        {initial ? "Editar servicio" : "Nuevo servicio"}
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Nombre
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
            placeholder="Manicura gel"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Duración (min)
          </label>
          <input
            required
            type="number"
            min={5}
            max={480}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Precio (RD$)
          </label>
          <div className="flex items-center gap-1">
            <span className="flex-shrink-0 text-xs text-zinc-500 px-2 py-2 rounded-lg border border-white/10 bg-ink-900">RD$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
              placeholder="1500"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
            placeholder="Descripción breve del servicio…"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#14F195] px-5 py-2 text-sm font-semibold text-[#0A0A0F] disabled:opacity-50 transition hover:opacity-90"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-5 py-2 text-sm text-zinc-400 transition hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Main client component ────────────────────────────────────────────────────
export function ServiciosClient({ services }: { services: Service[] }) {
  const [form, setForm] = useState<FormState>(null);
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [reordering, startReorder] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const nextOrder = services.length > 0
    ? Math.max(...services.map((s) => s.sort_order)) + 1
    : 1;

  function handleToggle(id: string, current: boolean) {
    startToggle(async () => { await toggleServiceAction(id, !current); });
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      await deleteServiceAction(id);
      setConfirmDelete(null);
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    const sorted = [...services].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(s => s.id === id);
    const siblingIdx = direction === "up" ? idx - 1 : idx + 1;
    if (siblingIdx < 0 || siblingIdx >= sorted.length) return;
    const sibling = sorted[siblingIdx];
    startReorder(async () => {
      await reorderServiceAction(id, sibling.id, services[idx].sort_order, sibling.sort_order);
    });
  }

  const sorted = [...services].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-3">
      {/* Add form or button */}
      {form?.mode === "create" ? (
        <ServiceForm
          nextOrder={nextOrder}
          onClose={() => setForm(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setForm({ mode: "create" })}
          className="flex items-center gap-2 rounded-xl border border-dashed border-white/[0.12] px-4 py-3 text-sm text-zinc-400 transition hover:border-[#14F195]/30 hover:text-[#14F195] w-full"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Añadir servicio
        </button>
      )}

      {/* Services list */}
      {sorted.length === 0 && !form && (
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 py-14 text-center">
          <p className="text-2xl">✂️</p>
          <p className="mt-3 text-sm text-zinc-500">No hay servicios todavía.</p>
          <p className="mt-1 text-xs text-zinc-600">Añade el primero con el botón de arriba.</p>
        </div>
      )}

      {sorted.map((svc, idx) => (
        <div key={svc.id}>
          {form?.mode === "edit" && form.service?.id === svc.id ? (
            <ServiceForm
              initial={svc}
              nextOrder={nextOrder}
              onClose={() => setForm(null)}
            />
          ) : (
            <div className={`flex items-center gap-3 rounded-xl border bg-ink-900/40 px-4 py-4 transition ${
              svc.active ? "border-white/[0.07]" : "border-white/[0.04] opacity-60"
            }`}>
              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  disabled={reordering || idx === 0}
                  onClick={() => handleMove(svc.id, "up")}
                  className="rounded p-0.5 text-zinc-600 transition hover:text-zinc-400 disabled:opacity-30"
                  title="Subir"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={reordering || idx === sorted.length - 1}
                  onClick={() => handleMove(svc.id, "down")}
                  className="rounded p-0.5 text-zinc-600 transition hover:text-zinc-400 disabled:opacity-30"
                  title="Bajar"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">{svc.name}</p>
                <p className="text-xs text-zinc-600">
                  {svc.duration_minutes} min
                  {svc.price != null ? ` · RD$${svc.price.toLocaleString()}` : ""}
                </p>
                {svc.description && (
                  <p className="mt-0.5 text-xs text-zinc-600 truncate italic">{svc.description}</p>
                )}
              </div>

              {/* Active badge */}
              <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                svc.active
                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                  : "border border-zinc-600/20 bg-zinc-600/10 text-zinc-500"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${svc.active ? "bg-emerald-400" : "bg-zinc-500"}`} />
                {svc.active ? "Activo" : "Inactivo"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Toggle */}
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => handleToggle(svc.id, svc.active)}
                  title={svc.active ? "Desactivar" : "Activar"}
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
                >
                  {svc.active ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => setForm({ mode: "edit", service: svc })}
                  title="Editar"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                {/* Delete */}
                {confirmDelete === svc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => handleDelete(svc.id)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                    >
                      {deleting ? "…" : "Sí, eliminar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(svc.id)}
                    title="Eliminar"
                    className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
