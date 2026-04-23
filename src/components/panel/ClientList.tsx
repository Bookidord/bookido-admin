"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

type Client = {
  email: string;
  name: string;
  phone: string | null;
  total: number;
  confirmed: number;
  completed: number;
  lastAt: string;
};

function clientTag(total: number): { label: string; cls: string } {
  if (total >= 10) return { label: "VIP", cls: "bg-amber-400/10 text-amber-400 ring-amber-400/20" };
  if (total >= 4)  return { label: "Regular", cls: "bg-[#14F195]/10 text-[#14F195] ring-[#14F195]/20" };
  return { label: "Nuevo", cls: "bg-zinc-700/40 text-zinc-400 ring-zinc-600/20" };
}

function parseDate(iso: string) {
  return new Date(iso.replace(" ", "T"));
}

export function ClientList({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q)
    );
  });

  return (
    <div>
      {/* Search */}
      <div className="mb-4 relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/[0.07] bg-ink-900/40 py-2.5 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20 sm:max-w-sm"
        />
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 py-16 text-center">
            <p className="text-2xl">👤</p>
            <p className="mt-3 text-sm text-zinc-500">No se encontraron clientes.</p>
          </div>
        ) : (
          filtered.map((c) => {
            const tag = clientTag(c.total);
            return (
              <Link
                key={c.email}
                href={`/panel/clientes/${encodeURIComponent(c.email)}`}
                className="block rounded-xl border border-white/[0.07] bg-ink-900/40 p-4 transition hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100 truncate">{c.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{c.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${tag.cls}`}>{tag.label}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                  <span>{c.total} reserva{c.total !== 1 ? "s" : ""}</span>
                  <span>Última: {formatDistanceToNow(parseDate(c.lastAt), { locale: es, addSuffix: true })}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-white/[0.07] bg-ink-900/40">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl">👤</p>
            <p className="mt-3 text-sm text-zinc-500">No se encontraron clientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Cliente", "Reservas", "Última visita", "Teléfono", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const tag = clientTag(c.total);
                  return (
                    <tr key={c.email} className="border-b border-white/[0.05] transition hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-zinc-300">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-100 truncate">{c.name}</p>
                            <p className="text-xs text-zinc-600 truncate">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{c.total}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tag.cls}`}>{tag.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-600">
                          {c.completed} completada{c.completed !== 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-zinc-400">
                        {formatDistanceToNow(parseDate(c.lastAt), { locale: es, addSuffix: true })}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.phone ? (
                          <a
                            href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {c.phone}
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/panel/clientes/${encodeURIComponent(c.email)}`}
                          className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300"
                        >
                          Ver historial →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
