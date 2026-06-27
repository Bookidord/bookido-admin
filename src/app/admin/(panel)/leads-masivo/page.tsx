"use client";

import { useEffect, useState, useCallback } from "react";

interface Lead {
  id: number;
  nombre: string;
  telefono: string;
  vertical: string;
  barrio: string;
  ciudad: string;
  rating: number;
  total_reviews: number;
  website: string | null;
  score: number;
  estado: string;
  notas: string | null;
  respondio: number;
  wa_ok: number | null;
  ros_score: number | null;
  ros_msg1_at: string | null;
  ros_msg2_at: string | null;
  ros_msg3_at: string | null;
  creado_en: string;
}

function calcRosScore(lead: Lead): number {
  let pts = 0;
  const v = (lead.vertical || "").toLowerCase();
  if (/restaurante|comedor|bar\b|barra|cantina|pizz|burger|sushi|bistro|cocina|mariscos|parrilla|grill|taverna|fonda|cafe\b|cafeter|loncher|ceviche|buffet|almuerzo/.test(v)) pts += 6;
  else if (/panaderia|dulceria|heladeria|food|bebidas|snack|kiosko/.test(v)) pts += 4;
  else if (/spa|fitness|gym|club|pilates|yoga/.test(v)) pts += 2;
  const rev = lead.total_reviews || 0;
  if (rev >= 100) pts += 4; else if (rev >= 50) pts += 3; else if (rev >= 20) pts += 2; else if (rev >= 5) pts += 1;
  const r = lead.rating || 0;
  if (r >= 4.5) pts += 4; else if (r >= 4.0) pts += 3; else if (r >= 3.5) pts += 2; else if (r >= 3.0) pts += 1;
  pts += lead.website ? 1 : 3;
  return Math.min(pts, 20);
}

function RosBadge({ score }: { score: number }) {
  if (score >= 14) return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/25">🟢 {score}/20</span>;
  if (score >= 8)  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/25">🟡 {score}/20</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 ring-1 ring-zinc-700">{score}/20</span>;
}

function SeqBadge({ lead }: { lead: Lead }) {
  if (!lead.ros_msg1_at) return null;
  if (!lead.ros_msg2_at) return <span className="text-[10px] text-zinc-400">✓ D0 · <span className="text-amber-400">⏳ D2</span></span>;
  if (!lead.ros_msg3_at) return <span className="text-[10px] text-zinc-400">✓✓ D0+D2 · <span className="text-amber-400">⏳ D7</span></span>;
  return <span className="text-[10px] text-emerald-400">✓✓✓ Seq completa</span>;
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    pendiente:   "bg-zinc-700 text-zinc-300",
    contactado:  "bg-blue-500/20 text-blue-300",
    calificado:  "bg-indigo-500/20 text-indigo-300",
    convertido:  "bg-emerald-500/20 text-emerald-300",
    cerrado:     "bg-red-500/20 text-red-400",
    pausado:     "bg-orange-500/20 text-orange-400",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[estado] || "bg-zinc-700 text-zinc-300"}`}>{estado}</span>;
}

const ESTADO_OPTIONS = ["", "pendiente", "contactado", "calificado", "convertido", "cerrado", "pausado"];
const ROS_OPTIONS = [
  { v: "", l: "Todos" },
  { v: "14", l: "🟢 Verde ≥14" },
  { v: "8", l: "🟡 Amarillo ≥8" },
  { v: "1", l: "Con ROS" },
];

export default function LeadsMasivo() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [waProgress, setWaProgress] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterRos, setFilterRos] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [notasModal, setNotasModal] = useState<{ id: number; text: string } | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (filterEstado) params.set("estado", filterEstado);
      if (filterVertical) params.set("vertical", filterVertical);
      const r = await fetch(`/api/outreach-proxy/leads?${params}`);
      const data: Lead[] = await r.json();
      setLeads(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterVertical]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter(l => {
    if (!filterRos) return true;
    const s = l.ros_score ?? calcRosScore(l);
    if (filterRos === "14") return s >= 14;
    if (filterRos === "8")  return s >= 8 && s < 14;
    if (filterRos === "1")  return s >= 1;
    return true;
  });

  const stats = {
    total:      leads.length,
    pendiente:  leads.filter(l => l.estado === "pendiente").length,
    contactado: leads.filter(l => l.estado === "contactado").length,
    calificado: leads.filter(l => l.estado === "calificado").length,
    cerrado:    leads.filter(l => l.estado === "cerrado").length,
    verde:      leads.filter(l => (l.ros_score ?? calcRosScore(l)) >= 14).length,
    amarillo:   leads.filter(l => { const s = l.ros_score ?? calcRosScore(l); return s >= 8 && s < 14; }).length,
    conWA:      leads.filter(l => l.wa_ok === 1).length,
    enSeq:      leads.filter(l => !!l.ros_msg1_at).length,
  };

  async function updateLead(id: number, body: Record<string, string>) {
    await fetch(`/api/outreach-proxy/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await fetchLeads();
  }

  async function checkAllWA() {
    setChecking(true);
    setWaProgress("Verificando WA…");
    try {
      const r = await fetch("/api/outreach-proxy/check-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      setWaProgress(`✓ ${d.checked || 0}/${d.total || 0} verificados`);
      await fetchLeads();
    } catch {
      setWaProgress("Error verificando WA");
    } finally {
      setChecking(false);
    }
  }

  async function runRos() {
    const r = await fetch("/api/outreach-proxy/ros/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const d = await r.json();
    alert(`ROS: ${d.enviados ?? 0} mensajes enviados`);
    await fetchLeads();
  }

  async function saveNotas() {
    if (!notasModal) return;
    await updateLead(notasModal.id, { notas: notasModal.text });
    setNotasModal(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Leads Masivo</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Pipeline de prospectos ROS Pro · Google Maps</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {waProgress && <span className="text-xs text-zinc-400">{waProgress}</span>}
          <button
            onClick={checkAllWA}
            disabled={checking}
            className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-600/30 disabled:opacity-50"
          >
            {checking ? "Verificando…" : "📱 Verificar WA"}
          </button>
          <button
            onClick={runRos}
            className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/30 transition hover:bg-indigo-600/30"
          >
            ▶ Ejecutar ROS
          </button>
          <button
            onClick={fetchLeads}
            className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-zinc-400 ring-1 ring-white/[0.07] transition hover:bg-white/[0.08]"
          >
            ↺ Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {[
          { l: "Total",       v: stats.total,      c: "text-zinc-100" },
          { l: "Pendiente",   v: stats.pendiente,  c: "text-zinc-400" },
          { l: "Contactado",  v: stats.contactado, c: "text-blue-400" },
          { l: "Calificado",  v: stats.calificado, c: "text-indigo-400" },
          { l: "Cerrado",     v: stats.cerrado,    c: "text-red-400" },
          { l: "Con WA",      v: stats.conWA,      c: "text-emerald-400" },
          { l: "🟢 Verde",    v: stats.verde,      c: "text-emerald-400" },
          { l: "🟡 Amarillo", v: stats.amarillo,   c: "text-amber-400" },
          { l: "En Secuencia",v: stats.enSeq,      c: "text-purple-400" },
        ].map(s => (
          <div key={s.l} className="flex flex-col gap-0.5 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
            <span className={`text-xl font-bold tabular-nums ${s.c}`}>{s.v}</span>
            <span className="text-[10px] text-zinc-600">{s.l}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 ring-1 ring-white/[0.07] focus:outline-none focus:ring-indigo-500/40"
        >
          {ESTADO_OPTIONS.map(o => (
            <option key={o} value={o}>{o || "Todos los estados"}</option>
          ))}
        </select>
        <select
          value={filterRos}
          onChange={e => setFilterRos(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 ring-1 ring-white/[0.07] focus:outline-none focus:ring-indigo-500/40"
        >
          {ROS_OPTIONS.map(o => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </select>
        <input
          value={filterVertical}
          onChange={e => setFilterVertical(e.target.value)}
          placeholder="Filtrar vertical…"
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 ring-1 ring-white/[0.07] placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 w-36"
        />
        <span className="ml-auto text-xs text-zinc-600">{filtered.length} leads</span>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                {["Negocio", "Teléfono", "Vertical", "Ciudad", "Rating", "ROS", "Estado", "Secuencia", "Acciones"].map(h => (
                  <th key={h} className="px-3 py-2.5 font-medium text-zinc-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-zinc-600">Cargando leads…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-zinc-600">Sin resultados</td>
                </tr>
              ) : filtered.map(lead => {
                const ros = lead.ros_score ?? calcRosScore(lead);
                return (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-3 py-2.5 max-w-[180px]">
                      <div className="font-medium text-zinc-200 truncate">{lead.nombre}</div>
                      {lead.notas && (
                        <div className="text-[10px] text-zinc-600 truncate mt-0.5">{lead.notas}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-zinc-300">{lead.telefono}</span>
                        {lead.wa_ok === 1 && (
                          <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] font-bold text-emerald-400">WA</span>
                        )}
                        {lead.wa_ok === 0 && (
                          <span className="rounded bg-zinc-700 px-1 py-0.5 text-[9px] font-bold text-zinc-500">✕WA</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 max-w-[130px]">
                      <span className="truncate text-zinc-400 block">{lead.vertical}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-zinc-500">{lead.ciudad}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-zinc-300">{lead.rating?.toFixed(1)}</span>
                      <span className="text-zinc-600 ml-0.5 text-[10px]">({lead.total_reviews})</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <RosBadge score={ros} />
                    </td>
                    <td className="px-3 py-2.5">
                      <EstadoBadge estado={lead.estado} />
                    </td>
                    <td className="px-3 py-2.5">
                      <SeqBadge lead={lead} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {lead.estado !== "calificado" && (
                          <button
                            onClick={() => updateLead(lead.id, { estado: "calificado" })}
                            title="Calificar"
                            className="rounded px-1.5 py-0.5 text-[10px] text-indigo-400 hover:bg-indigo-500/10 transition"
                          >
                            ✓
                          </button>
                        )}
                        {(lead.estado === "pendiente" || lead.estado === "contactado") && (
                          <button
                            onClick={() => updateLead(lead.id, { estado: "pausado" })}
                            title="Pausar"
                            className="rounded px-1.5 py-0.5 text-[10px] text-orange-400 hover:bg-orange-500/10 transition"
                          >
                            ⏸
                          </button>
                        )}
                        {lead.estado === "pausado" && (
                          <button
                            onClick={() => updateLead(lead.id, { estado: "pendiente" })}
                            title="Reactivar"
                            className="rounded px-1.5 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition"
                          >
                            ▶
                          </button>
                        )}
                        {lead.estado !== "cerrado" && (
                          <button
                            onClick={() => updateLead(lead.id, { estado: "cerrado" })}
                            title="Cerrar"
                            className="rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10 transition"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          onClick={() => setNotasModal({ id: lead.id, text: lead.notas || "" })}
                          title="Notas"
                          className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/[0.06] transition"
                        >
                          📝
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notas modal */}
      {notasModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setNotasModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-zinc-900 p-5 ring-1 ring-white/[0.08] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-semibold text-zinc-100">Notas — Lead #{notasModal.id}</h3>
            <textarea
              value={notasModal.text}
              onChange={e => setNotasModal(n => n ? { ...n, text: e.target.value } : null)}
              rows={4}
              autoFocus
              className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-200 ring-1 ring-white/[0.07] focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none"
              placeholder="Escribe las notas aquí…"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setNotasModal(null)}
                className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.05] transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveNotas}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
