"use client";

import { useState, useTransition } from "react";
import { saveProductAction, deleteProductAction, toggleProductAction } from "@/app/panel/productos/actions";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  active: boolean;
  sort_order: number;
};

const EMPTY: Omit<Product, "id"> = { name: "", description: "", price: 0, photo_url: "", active: true, sort_order: 0 };

export function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setForm({ ...EMPTY, sort_order: products.length });
    setEditing(null);
    setIsNew(true);
    setError(null);
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description, price: p.price, photo_url: p.photo_url, active: p.active, sort_order: p.sort_order });
    setEditing(p);
    setIsNew(false);
    setError(null);
  }

  function closeForm() { setIsNew(false); setEditing(null); setError(null); }

  function handleSave() {
    if (!form.name.trim()) { setError("El nombre es requerido."); return; }
    if (form.price <= 0) { setError("El precio debe ser mayor a 0."); return; }
    setError(null);
    startTransition(async () => {
      const res = await saveProductAction({ ...form, id: editing?.id });
      if (!res.ok) { setError(res.error ?? "Error al guardar"); return; }
      if (editing) {
        setProducts((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...form } : p));
      } else {
        // Refetch via reload is cleanest, but optimistic insert works too
        setProducts((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
      }
      closeForm();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    startTransition(async () => {
      const res = await deleteProductAction(id);
      if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await toggleProductAction(id, active);
      if (res.ok) setProducts((prev) => prev.map((p) => p.id === id ? { ...p, active } : p));
    });
  }

  const showForm = isNew || editing !== null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-future text-xl font-semibold text-white">Productos</h1>
          <p className="text-sm text-zinc-500">Se muestran en tu landing page con botón de pedido por WhatsApp.</p>
        </div>
        {!showForm && (
          <button onClick={openNew}
            className="flex items-center gap-2 rounded-xl bg-[#14F195] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition hover:bg-[#14F195]/90">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo producto
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-[#14F195]/20 bg-[#14F195]/[0.03] p-5">
          <p className="mb-4 text-sm font-semibold text-white">{isNew ? "Nuevo producto" : "Editar producto"}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Nombre *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#14F195]/40" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Precio (RD$) *</label>
              <input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: +e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#14F195]/40" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">Descripción</label>
              <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
                rows={2} className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#14F195]/40" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">URL de foto</label>
              <input value={form.photo_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value || null }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#14F195]/40" />
            </div>
          </div>
          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} disabled={isPending}
              className="rounded-lg bg-[#14F195] px-5 py-2 text-sm font-semibold text-[#0A0A0F] transition hover:bg-[#14F195]/90 disabled:opacity-50">
              {isPending ? "Guardando…" : "Guardar"}
            </button>
            <button onClick={closeForm} className="rounded-lg border border-white/[0.07] px-5 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.04]">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {products.length === 0 && !showForm && (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] py-16 text-center">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-sm text-zinc-500">Aún no tienes productos. ¡Agrega el primero!</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className={`relative rounded-xl border bg-ink-900/40 overflow-hidden transition ${p.active ? "border-white/[0.07]" : "border-white/[0.03] opacity-50"}`}>
            {p.photo_url && (
              <img src={p.photo_url} alt={p.name} className="h-40 w-full object-cover" />
            )}
            {!p.photo_url && (
              <div className="flex h-40 w-full items-center justify-center bg-white/[0.03] text-4xl">🛍️</div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-white text-sm">{p.name}</p>
                <p className="shrink-0 text-sm font-bold" style={{ color: "var(--hero-hex, #14F195)" }}>
                  RD${p.price.toLocaleString("es-DO")}
                </p>
              </div>
              {p.description && <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{p.description}</p>}
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => openEdit(p)}
                  className="flex-1 rounded-lg border border-white/[0.07] py-1.5 text-xs text-zinc-400 transition hover:bg-white/[0.05]">
                  Editar
                </button>
                <button onClick={() => handleToggle(p.id, !p.active)} disabled={isPending}
                  className={`flex-1 rounded-lg border py-1.5 text-xs transition ${p.active ? "border-zinc-600/30 text-zinc-500 hover:bg-white/[0.03]" : "border-[#14F195]/30 text-[#14F195] hover:bg-[#14F195]/10"}`}>
                  {p.active ? "Ocultar" : "Activar"}
                </button>
                <button onClick={() => handleDelete(p.id)} disabled={isPending}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-white/[0.06] hover:text-red-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
