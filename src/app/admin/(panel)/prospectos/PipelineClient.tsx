'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  crearProspecto, moverEstado, registrarContacto, borrarProspecto, crearLicenciaDesdeProspecto,
} from './actions';

export type Prospecto = {
  id: string; nombre: string; restaurante: string; telefono: string | null;
  zona: string | null; canal: string; estado: string; motivo_perdido: string | null;
  notas: string | null; ultimo_contacto: string | null; licencia_id: string | null;
};
export type Metrics = {
  activos: number;
  porCanal: { canal: string; total: number; pagando: number }[];
  tiempoEtapaDias: { etapa: string; dias: number | null }[];
};

const ESTADOS = ['nuevo', 'contactado', 'demo', 'prueba', 'pagando', 'perdido'] as const;
const CANALES = ['Reels', 'grupo FB', 'referido', 'anuncio', 'otro'];
const ACTIVOS = ['nuevo', 'contactado', 'demo', 'prueba'];
const ESTADO_STYLE: Record<string, string> = {
  nuevo: 'bg-zinc-500/15 text-zinc-300',
  contactado: 'bg-blue-500/15 text-blue-400',
  demo: 'bg-indigo-500/15 text-indigo-400',
  prueba: 'bg-amber-500/15 text-amber-400',
  pagando: 'bg-emerald-500/15 text-emerald-400',
  perdido: 'bg-red-500/15 text-red-400',
};

function diasDesde(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function fmtDias(d: number | null): string {
  if (d === null) return '—';
  if (d < 1) return 'hoy';
  return `${d}d`;
}

export default function PipelineClient({ prospectos, metrics }: { prospectos: Prospecto[]; metrics: Metrics }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', restaurante: '', telefono: '', zona: '', canal: 'Reels', notas: '' });

  const run = (fn: () => Promise<{ error?: string; ok?: boolean; license_key?: string }>) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      if (r?.error) setMsg('⚠ ' + r.error);
      else if (r?.license_key) setMsg('✅ Licencia creada: ' + r.license_key);
      router.refresh();
    });

  const onCrear = () => {
    if (!form.restaurante && !form.nombre) { setMsg('⚠ Nombre o restaurante requerido'); return; }
    start(async () => {
      setMsg(null);
      const r = await crearProspecto(form);
      if (r?.error) { setMsg('⚠ ' + r.error); return; }
      setForm({ nombre: '', restaurante: '', telefono: '', zona: '', canal: 'Reels', notas: '' });
      setShowForm(false);
      router.refresh();
    });
  };

  const onEstado = (p: Prospecto, estado: string) => {
    if (estado === p.estado) return;
    if (estado === 'perdido') {
      const motivo = window.prompt('Motivo de pérdida:') || '';
      run(() => moverEstado(p.id, 'perdido', motivo));
    } else {
      run(() => moverEstado(p.id, estado));
    }
  };

  const inp = 'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white';

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Captación ROS Pro</h1>
          <p className="mt-1 text-sm text-zinc-400">Pipeline de prospectos: nuevo → contactado → demo → prueba → pagando.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
          + Nuevo prospecto
        </button>
      </div>

      {/* ── Métricas ── */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Prospectos activos</div>
          <div className="mt-1 text-3xl font-bold text-white">{metrics.activos}</div>
          <div className="text-xs text-zinc-500">nuevo · contactado · demo · prueba</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Conversión por canal (→ pagando)</div>
          <div className="mt-2 space-y-1">
            {metrics.porCanal.length === 0 && <div className="text-sm text-zinc-600">—</div>}
            {metrics.porCanal.map(c => (
              <div key={c.canal} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{c.canal}</span>
                <span className="text-zinc-400">{c.pagando}/{c.total} <span className="text-emerald-400">({c.total ? Math.round((c.pagando / c.total) * 100) : 0}%)</span></span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Tiempo promedio por etapa</div>
          <div className="mt-2 space-y-1">
            {metrics.tiempoEtapaDias.map(t => (
              <div key={t.etapa} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{t.etapa}</span>
                <span className="text-zinc-400">{t.dias === null ? '—' : `${t.dias.toFixed(1)} d`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {msg && <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200">{msg}</div>}

      {/* ── Form nuevo ── */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <input className={inp} placeholder="Restaurante" value={form.restaurante} onChange={e => setForm({ ...form, restaurante: e.target.value })} />
            <input className={inp} placeholder="Contacto (nombre)" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input className={inp} placeholder="Teléfono / WhatsApp" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            <input className={inp} placeholder="Zona" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })} />
            <select className={inp} value={form.canal} onChange={e => setForm({ ...form, canal: e.target.value })}>
              {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={inp} placeholder="Notas" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button disabled={pending} onClick={onCrear} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">Crear</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-300">Cancelar</button>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Restaurante / contacto</th>
              <th className="px-4 py-3">Zona</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Últ. contacto</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {prospectos.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-500">Sin prospectos todavía.</td></tr>
            )}
            {prospectos.map(p => {
              const d = diasDesde(p.ultimo_contacto);
              const vencido = ACTIVOS.includes(p.estado) && d !== null && d >= 3;
              const tel = (p.telefono || '').replace(/[^0-9]/g, '');
              return (
                <tr key={p.id} className="align-top hover:bg-zinc-900/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-200">{p.restaurante || '—'}</div>
                    <div className="text-xs text-zinc-500">{p.nombre}{p.telefono ? ` · ${p.telefono}` : ''}</div>
                    {p.estado === 'perdido' && p.motivo_perdido && <div className="text-xs text-red-400/80">motivo: {p.motivo_perdido}</div>}
                    {p.notas && <div className="mt-0.5 max-w-xs text-xs text-zinc-600">{p.notas}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{p.zona || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.canal}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.estado}
                      disabled={pending}
                      onChange={e => onEstado(p, e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_STYLE[p.estado] ?? 'bg-zinc-700 text-zinc-300'}`}
                    >
                      {ESTADOS.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={vencido ? 'font-semibold text-red-400' : 'text-zinc-400'}>{fmtDias(d)}</span>
                    {vencido && <span className="ml-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">⚠ sin seguimiento</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {tel && <a href={`https://wa.me/${tel}`} target="_blank" className="rounded-lg bg-green-800/30 px-2.5 py-1 text-xs font-semibold text-green-300 hover:bg-green-800/50">WhatsApp</a>}
                      <button disabled={pending} onClick={() => run(() => registrarContacto(p.id))} className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700">Contacté</button>
                      {p.estado === 'pagando' && !p.licencia_id && (
                        <button disabled={pending} onClick={() => run(() => crearLicenciaDesdeProspecto(p.id))} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500">Crear licencia</button>
                      )}
                      {p.licencia_id && <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-400">✓ licencia</span>}
                      <button disabled={pending} onClick={() => { if (confirm('¿Borrar prospecto?')) run(() => borrarProspecto(p.id)); }} className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-500 hover:text-red-400">✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
