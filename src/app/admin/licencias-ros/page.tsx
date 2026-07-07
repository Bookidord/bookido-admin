'use client';
import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface Licencia {
  id: string; license_key: string; restaurante_nombre: string; plan: string; estado: string;
  fecha_inicio: string; fecha_fin: string; monto_rd: number; pagado: boolean;
  contacto_nombre: string; contacto_telefono: string; dia_cobro: number;
  auto_renovar: boolean; hostname: string; ip_local: string; anydesk_id: string;
  historial_pagos: any[]; updated_at: string; created_at: string;
  proximo_cobro?: string | null; notas_internas?: string | null;
  // Control del panel (verificación + tienda). Opcionales.
  verificado?: string | null; tienda_url?: string | null; tienda_activa?: boolean | null;
  tienda_status?: string | null; tienda_checked_at?: string | null; tienda_pedidos_hoy?: number | null;
  last_errors?: string | null; last_seen_version?: string | null;
  // Telemetría (server/telemetry.js → ros_licencias). Opcionales: pueden no existir aún.
  app_version?: string; last_checkin?: string | null; telemetry_at?: string | null;
  app_status?: string | null; printer_status?: string | null; printer_detail?: string | null;
  print_queue_pending?: number | null; last_sale_at?: string | null; disk_free_mb?: number | null;
}

const VERIF: Record<string, { label: string; cls: string }> = {
  verificado: { label: 'VERIFICADO', cls: 'bg-emerald-500/20 text-emerald-400' },
  en_prueba: { label: 'EN PRUEBA', cls: 'bg-blue-500/20 text-blue-400' },
  pendiente: { label: 'PENDIENTE', cls: 'bg-zinc-600/40 text-zinc-300' },
};

// Semáforo de salud (misma lógica que el VPS lib.php → tel_semaforo).
// Frescura = telemetry_at (ping cada 15 min) con respaldo en last_checkin.
const TEL = { RED_MIN: 30, AMBER_MIN: 20, QUEUE_MAX: 5 };
function semaforo(lic: Licencia): { level: 'verde' | 'ambar' | 'rojo'; dot: string; label: string; reasons: string[] } {
  const stamp = lic.telemetry_at || lic.last_checkin || null;
  const ageMin = stamp ? (Date.now() - new Date(stamp).getTime()) / 60000 : null;
  if (ageMin === null || ageMin > TEL.RED_MIN) {
    return { level: 'rojo', dot: 'bg-red-400', label: 'SIN CONEXIÓN', reasons: [ageMin === null ? 'sin ping' : `sin ping hace ${Math.round(ageMin)} min`] };
  }
  const pending = lic.print_queue_pending ?? 0;
  const reasons: string[] = [];
  if (lic.printer_status === 'fail') reasons.push('impresora en fallo');
  if (pending > TEL.QUEUE_MAX) reasons.push(`cola: ${pending} pendientes`);
  if (ageMin > TEL.AMBER_MIN) reasons.push(`ping hace ${Math.round(ageMin)} min`);
  if (reasons.length) return { level: 'ambar', dot: 'bg-amber-400', label: 'ATENCIÓN', reasons };
  return { level: 'verde', dot: 'bg-emerald-400', label: 'OK', reasons: [] };
}

// Uptime de los últimos 7 días (por día) reconstruido desde los eventos de
// transición del timeline. "up" = cualquier nivel que NO sea rojo.
function uptime7d(events: any[], nowLevel: string) {
  const DAY = 86400000, now = Date.now(), start = now - 7 * DAY;
  const trans = events.filter(e => e.tipo === 'transicion')
    .map(e => ({ t: new Date(e.at).getTime(), lvl: e.to_val }))
    .sort((a, b) => a.t - b.t);
  let lvlAtStart = 'verde';
  for (const tr of trans) { if (tr.t <= start) lvlAtStart = tr.lvl; else break; }
  const pts = [{ t: start, lvl: lvlAtStart }, ...trans.filter(tr => tr.t > start && tr.t <= now), { t: now, lvl: nowLevel }];
  const days: { date: Date; pct: number | null }[] = [];
  for (let d = 0; d < 7; d++) {
    const dStart = start + d * DAY, dEnd = dStart + DAY;
    let up = 0, total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const s = Math.max(pts[i].t, dStart), e = Math.min(pts[i + 1].t, dEnd);
      if (e <= s) continue;
      total += e - s; if (pts[i].lvl !== 'rojo') up += e - s;
    }
    days.push({ date: new Date(dStart), pct: total ? up / total : null });
  }
  return days;
}

const PLANES: Record<string, { label: string; meses: number; precio: number }> = {
  mensual: { label: 'Mensual', meses: 1, precio: 1499 },
  trimestral: { label: 'Trimestral', meses: 3, precio: 3999 },
  semestral: { label: 'Semestral', meses: 6, precio: 7499 },
  anual: { label: 'Anual', meses: 12, precio: 13999 },
  lifetime: { label: 'Lifetime', meses: 999, precio: 0 },
};

export default function LicenciasROS() {
  const supabase = createBrowserSupabaseClient()!;
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', plan: 'mensual', monto: 1499, dia: 1 });
  const [editId, setEditId] = useState<string | null>(null);
  const [ef, setEf] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'rojos' | 'porvencer' | 'impagos'>('todos');
  const [verLic, setVerLic] = useState<Licencia | null>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [evLoading, setEvLoading] = useState(false);

  const abrirDetalle = async (lic: Licencia) => {
    setVerLic(lic); setEventos([]); setEvLoading(true);
    const { data } = await supabase.from('ros_telemetry_events').select('*').eq('license_key', lic.license_key).order('at', { ascending: false }).limit(200);
    setEventos(data || []); setEvLoading(false);
  };

  const load = async () => {
    const { data } = await supabase.from('ros_licencias').select('*').order('created_at', { ascending: false });
    setLicencias(data || []); setLoading(false);
  };
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

  const diasRestantes = (fin: string) => Math.ceil((new Date(fin).getTime() - Date.now()) / 86400000);

  const crear = async () => {
    const p = PLANES[form.plan]; const inicio = new Date(); const fin = new Date();
    fin.setMonth(fin.getMonth() + p.meses);
    const slug = form.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
    await supabase.from('ros_licencias').insert({
      restaurante_nombre: form.nombre, restaurante_slug: slug, plan: form.plan, estado: 'activa',
      fecha_inicio: inicio.toISOString().split('T')[0], fecha_fin: fin.toISOString().split('T')[0],
      monto_rd: form.monto || p.precio, pagado: true, contacto_nombre: form.contacto,
      contacto_telefono: form.telefono, dia_cobro: form.dia, auto_renovar: true, grace_days: 5,
      proximo_cobro: fin.toISOString().split('T')[0],
      historial_pagos: [{ fecha: inicio.toISOString().split('T')[0], monto: form.monto || p.precio, plan: form.plan }],
    });
    setShowForm(false); load();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    await supabase.from('ros_licencias').update({ estado, updated_at: new Date().toISOString() }).eq('id', id); load();
  };

  const renovar = async (lic: Licencia) => {
    const p = PLANES[lic.plan]; const hoy = new Date().toISOString().split('T')[0];
    const base = lic.fecha_fin > hoy ? lic.fecha_fin : hoy;
    const nuevaFin = new Date(base); nuevaFin.setMonth(nuevaFin.getMonth() + p.meses);
    const pagos = Array.isArray(lic.historial_pagos) ? [...lic.historial_pagos] : [];
    pagos.push({ fecha: hoy, monto: p.precio, plan: lic.plan });
    await supabase.from('ros_licencias').update({
      estado: 'activa', fecha_fin: nuevaFin.toISOString().split('T')[0],
      proximo_cobro: nuevaFin.toISOString().split('T')[0], pagado: true,
      historial_pagos: pagos, updated_at: new Date().toISOString(),
    }).eq('id', lic.id); load();
  };

  const abrirEditar = (lic: Licencia) => {
    setEditId(lic.id);
    setEf({
      restaurante_nombre: lic.restaurante_nombre || '', plan: lic.plan || 'mensual',
      fecha_inicio: lic.fecha_inicio || '', fecha_fin: lic.fecha_fin || '', proximo_cobro: lic.proximo_cobro || '',
      monto_rd: lic.monto_rd ?? 0, dia_cobro: lic.dia_cobro ?? 1, pagado: !!lic.pagado,
      contacto_nombre: lic.contacto_nombre || '', contacto_telefono: lic.contacto_telefono || '',
      verificado: lic.verificado || 'pendiente', tienda_activa: !!lic.tienda_activa,
      tienda_url: lic.tienda_url || '', notas_internas: lic.notas_internas || '',
    });
  };

  const guardarEdicion = async (id: string) => {
    setSaving(true);
    await supabase.from('ros_licencias').update({
      restaurante_nombre: ef.restaurante_nombre, plan: ef.plan,
      fecha_inicio: ef.fecha_inicio || null, fecha_fin: ef.fecha_fin || null, proximo_cobro: ef.proximo_cobro || null,
      monto_rd: +ef.monto_rd || 0, dia_cobro: +ef.dia_cobro || 1, pagado: !!ef.pagado,
      contacto_nombre: ef.contacto_nombre, contacto_telefono: ef.contacto_telefono,
      verificado: ef.verificado, tienda_activa: !!ef.tienda_activa, tienda_url: ef.tienda_url,
      notas_internas: ef.notas_internas, updated_at: new Date().toISOString(),
    }).eq('id', id);
    setSaving(false); setEditId(null); load();
  };

  const ec: Record<string, string> = { activa: 'bg-green-500/20 text-green-400', suspendida: 'bg-red-500/20 text-red-400', expirada: 'bg-yellow-500/20 text-yellow-400', trial: 'bg-blue-500/20 text-blue-400' };

  // Lista visible: filtro + búsqueda + orden (rojos primero por default).
  const RANK: Record<string, number> = { rojo: 0, ambar: 1, verde: 2 };
  const vista = [...licencias]
    .filter(l => !q.trim() || (l.restaurante_nombre || '').toLowerCase().includes(q.trim().toLowerCase()))
    .filter(l => {
      if (filtro === 'rojos') return semaforo(l).level === 'rojo';
      if (filtro === 'porvencer') return diasRestantes(l.fecha_fin) <= 15;
      if (filtro === 'impagos') return !l.pagado;
      return true;
    })
    .sort((a, b) => {
      const ra = RANK[semaforo(a).level] ?? 3, rb = RANK[semaforo(b).level] ?? 3;
      if (ra !== rb) return ra - rb;
      return diasRestantes(a.fecha_fin) - diasRestantes(b.fecha_fin);
    });

  if (loading) return <div className="p-8 text-center text-zinc-500">Cargando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-white">Licencias ROS Pro</h1><p className="text-sm text-zinc-500">{licencias.length} restaurante{licencias.length !== 1 ? 's' : ''}</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">+ Nueva Licencia</button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre…" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white w-56" />
        {([['todos', 'Todos'], ['rojos', 'Solo rojos'], ['porvencer', 'Por vencer'], ['impagos', 'Impagos']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFiltro(k)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filtro === k ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>{label}</button>
        ))}
        <span className="text-xs text-zinc-500 ml-auto">{vista.length} de {licencias.length}</span>
      </div>

      {showForm && <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Nueva Licencia</h3>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Nombre restaurante" className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-white" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          <input placeholder="Contacto" className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-white" value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} />
          <input placeholder="WhatsApp" className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-white" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
          <select className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-white" value={form.plan} onChange={e => setForm({...form, plan: e.target.value, monto: PLANES[e.target.value].precio})}>
            {Object.entries(PLANES).map(([k, v]) => <option key={k} value={k}>{v.label} — RD${v.precio.toLocaleString()}</option>)}
          </select>
          <input type="number" placeholder="Monto RD$" className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-white" value={form.monto} onChange={e => setForm({...form, monto: +e.target.value})} />
          <input type="number" placeholder="Día cobro (1-28)" className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-white" value={form.dia} min={1} max={28} onChange={e => setForm({...form, dia: +e.target.value})} />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={crear} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500">Crear</button>
          <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-zinc-700 text-zinc-300 rounded-lg">Cancelar</button>
        </div>
      </div>}

      <div className="space-y-3">
        {vista.length === 0 && <p className="text-sm text-zinc-500 py-6 text-center">Sin resultados.</p>}
        {vista.map(lic => { const d = diasRestantes(lic.fecha_fin); const sem = semaforo(lic); return (
          <div key={lic.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2.5">
                <span title={sem.label} className={`mt-1.5 w-3 h-3 shrink-0 rounded-full ${sem.dot} ${sem.level !== 'verde' ? 'animate-pulse' : ''}`} />
                <div>
                  <h3 className="text-lg font-bold text-white">{lic.restaurante_nombre}</h3>
                  {sem.level !== 'verde' && <p className={`text-xs font-medium ${sem.level === 'rojo' ? 'text-red-400' : 'text-amber-400'}`}>{sem.reasons.join(' · ')}</p>}
                  <p className="text-xs text-zinc-600 font-mono mt-0.5">Key: {lic.license_key}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lic.tienda_activa && <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${lic.tienda_status === 'caida' ? 'bg-red-500/20 text-red-400' : lic.tienda_status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-600/40 text-zinc-300'}`}>🛒 {lic.tienda_status === 'caida' ? 'CAÍDA' : lic.tienda_status === 'online' ? 'ONLINE' : '—'}</span>}
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${VERIF[lic.verificado || 'pendiente']?.cls || VERIF.pendiente.cls}`}>{VERIF[lic.verificado || 'pendiente']?.label || 'PENDIENTE'}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ec[lic.estado] || 'bg-zinc-800 text-zinc-400'}`}>{lic.estado.toUpperCase()}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
              <div><span className="text-zinc-500">Plan:</span> <span className="text-white font-bold">{PLANES[lic.plan]?.label || lic.plan}</span></div>
              <div><span className="text-zinc-500">Vence:</span> <span className={`font-bold ${d <= 5 ? 'text-red-400' : d <= 15 ? 'text-yellow-400' : 'text-green-400'}`}>{lic.fecha_fin} ({d}d)</span></div>
              <div><span className="text-zinc-500">Monto:</span> <span className="text-yellow-400 font-bold">RD${lic.monto_rd?.toLocaleString()}</span></div>
              <div><span className="text-zinc-500">Contacto:</span> <span className="text-white">{lic.contacto_telefono || '—'}</span></div>
            </div>
            {(lic.telemetry_at || lic.printer_status) && <div className="grid grid-cols-4 gap-4 mt-3 text-xs">
              <div><span className="text-zinc-500">Impresora:</span> <span className={lic.printer_status === 'fail' ? 'text-red-400 font-bold' : lic.printer_status === 'ok' ? 'text-green-400 font-bold' : 'text-zinc-400'}>{lic.printer_status === 'fail' ? 'FALLO' : lic.printer_status === 'ok' ? 'OK' : (lic.printer_status || '—')}</span></div>
              <div><span className="text-zinc-500">Cola:</span> <span className={`font-bold ${(lic.print_queue_pending ?? 0) > TEL.QUEUE_MAX ? 'text-yellow-400' : 'text-white'}`}>{lic.print_queue_pending ?? 0}</span></div>
              <div><span className="text-zinc-500">Últ. venta:</span> <span className="text-white">{lic.last_sale_at || '—'}</span></div>
              <div><span className="text-zinc-500">Disco:</span> <span className="text-white">{lic.disk_free_mb != null ? `${Math.round(lic.disk_free_mb / 1024)} GB` : '—'}</span></div>
            </div>}
            {lic.hostname && <div className="mt-3 text-xs text-zinc-600">PC: {lic.hostname} · IP: {lic.ip_local} · AnyDesk: {lic.anydesk_id || '—'} · Ping: {lic.telemetry_at ? new Date(lic.telemetry_at).toLocaleString() : (lic.updated_at ? new Date(lic.updated_at).toLocaleString() : '—')}</div>}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => abrirDetalle(lic)} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-lg hover:bg-blue-500/30">Ver</button>
              <button onClick={() => (editId === lic.id ? setEditId(null) : abrirEditar(lic))} className="px-3 py-1.5 bg-zinc-700 text-zinc-100 text-xs font-bold rounded-lg hover:bg-zinc-600">{editId === lic.id ? 'Cerrar' : 'Editar'}</button>
              {lic.estado === 'activa' && <button onClick={() => cambiarEstado(lic.id, 'suspendida')} className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30">Suspender</button>}
              {lic.estado === 'suspendida' && <button onClick={() => cambiarEstado(lic.id, 'activa')} className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30">Reactivar</button>}
              {(lic.estado === 'expirada' || d <= 5) && <button onClick={() => renovar(lic)} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg hover:bg-yellow-500/30">Renovar (+{PLANES[lic.plan]?.meses || 1}m)</button>}
              {lic.contacto_telefono && <a href={`https://wa.me/${lic.contacto_telefono.replace(/[^0-9]/g, '')}`} target="_blank" className="px-3 py-1.5 bg-green-800/30 text-green-300 text-xs font-bold rounded-lg">WhatsApp</a>}
              {lic.tienda_url && <a href={lic.tienda_url} target="_blank" className={`px-3 py-1.5 text-xs font-bold rounded-lg ${lic.tienda_activa ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-700/50 text-zinc-500 line-through'}`}>Tienda</a>}
            </div>

            {editId === lic.id && <div className="mt-4 border-t border-zinc-800 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <label className="text-xs text-zinc-500">Nombre<input className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.restaurante_nombre} onChange={e => setEf({ ...ef, restaurante_nombre: e.target.value })} /></label>
                <label className="text-xs text-zinc-500">Plan<select className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.plan} onChange={e => setEf({ ...ef, plan: e.target.value })}>{Object.entries(PLANES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
                <label className="text-xs text-zinc-500">Monto RD$<input type="number" className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.monto_rd} onChange={e => setEf({ ...ef, monto_rd: e.target.value })} /></label>
                <label className="text-xs text-zinc-500">Inicio<input type="date" className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.fecha_inicio} onChange={e => setEf({ ...ef, fecha_inicio: e.target.value })} /></label>
                <label className="text-xs text-zinc-500">Vence<input type="date" className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.fecha_fin} onChange={e => setEf({ ...ef, fecha_fin: e.target.value })} /></label>
                <label className="text-xs text-zinc-500">Próximo cobro<input type="date" className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.proximo_cobro} onChange={e => setEf({ ...ef, proximo_cobro: e.target.value })} /></label>
                <label className="text-xs text-zinc-500">Día cobro<input type="number" min={1} max={28} className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.dia_cobro} onChange={e => setEf({ ...ef, dia_cobro: e.target.value })} /></label>
                <label className="text-xs text-zinc-500">Contacto<input className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.contacto_nombre} onChange={e => setEf({ ...ef, contacto_nombre: e.target.value })} /></label>
                <label className="text-xs text-zinc-500">WhatsApp<input className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.contacto_telefono} onChange={e => setEf({ ...ef, contacto_telefono: e.target.value })} /></label>
                <label className="text-xs text-zinc-500">Verificación<select className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.verificado} onChange={e => setEf({ ...ef, verificado: e.target.value })}><option value="pendiente">Pendiente</option><option value="en_prueba">En prueba</option><option value="verificado">Verificado</option></select></label>
                <label className="text-xs text-zinc-500">Link tienda<input placeholder="https://..." className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" value={ef.tienda_url} onChange={e => setEf({ ...ef, tienda_url: e.target.value })} /></label>
                <label className="flex items-center gap-2 text-xs text-zinc-400 mt-5"><input type="checkbox" checked={ef.tienda_activa} onChange={e => setEf({ ...ef, tienda_activa: e.target.checked })} /> Tienda activa</label>
                <label className="flex items-center gap-2 text-xs text-zinc-400 mt-5"><input type="checkbox" checked={ef.pagado} onChange={e => setEf({ ...ef, pagado: e.target.checked })} /> Pagado (mes actual)</label>
              </div>
              <label className="block text-xs text-zinc-500 mt-3">Notas internas<textarea className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" rows={2} value={ef.notas_internas} onChange={e => setEf({ ...ef, notas_internas: e.target.value })} /></label>
              <div className="flex gap-2 mt-3">
                <button disabled={saving} onClick={() => guardarEdicion(lic.id)} className="px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
                <button onClick={() => setEditId(null)} className="px-5 py-2 bg-zinc-700 text-zinc-300 text-sm rounded-lg">Cancelar</button>
              </div>
            </div>}
          </div>
        ); })}
      </div>

      {verLic && (() => {
        const nivel = semaforo(verLic).level;
        const dias = uptime7d(eventos, nivel);
        const versiones = eventos.filter(e => e.tipo === 'version');
        const barCls = (p: number | null) => p === null ? 'bg-zinc-700' : p >= 0.99 ? 'bg-emerald-500' : p >= 0.8 ? 'bg-amber-500' : 'bg-red-500';
        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4" onClick={() => setVerLic(null)}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl my-8 p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{verLic.restaurante_nombre}</h2>
                  <p className="text-xs text-zinc-500">v{verLic.app_version || '—'} · {verLic.hostname || '—'} · último ping {verLic.telemetry_at ? new Date(verLic.telemetry_at).toLocaleString() : '—'}</p>
                </div>
                <button onClick={() => setVerLic(null)} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded-lg text-sm">Cerrar</button>
              </div>

              {/* Uptime 7 días */}
              <h3 className="text-sm font-bold text-zinc-300 mb-2">Uptime · últimos 7 días</h3>
              <div className="flex items-end gap-2 h-24 mb-1">
                {dias.map((dd, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${dd.date.toLocaleDateString()} — ${dd.pct === null ? 'sin datos' : Math.round(dd.pct * 100) + '% up'}`}>
                    <div className={`w-full rounded-t ${barCls(dd.pct)}`} style={{ height: `${dd.pct === null ? 4 : Math.max(4, dd.pct * 100)}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-5">{dias.map((dd, i) => <div key={i} className="flex-1 text-center text-[10px] text-zinc-500">{dd.date.getDate()}/{dd.date.getMonth() + 1}</div>)}</div>

              {/* Errores del último ping */}
              <h3 className="text-sm font-bold text-zinc-300 mb-2">Errores del último ping</h3>
              <pre className="bg-black/40 border border-zinc-800 rounded-lg p-3 text-xs text-red-300 whitespace-pre-wrap max-h-40 overflow-y-auto mb-5">{verLic.last_errors?.trim() || 'Sin errores reportados.'}</pre>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Timeline transiciones */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 mb-2">Timeline de estado</h3>
                  {evLoading ? <p className="text-xs text-zinc-500">Cargando…</p> : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {eventos.filter(e => e.tipo === 'transicion').length === 0 && <p className="text-xs text-zinc-600">Sin transiciones registradas.</p>}
                      {eventos.filter(e => e.tipo === 'transicion').map(e => (
                        <div key={e.id} className="text-xs">
                          <span className="text-zinc-500">{new Date(e.at).toLocaleString()}</span>{' '}
                          <span className={e.to_val === 'rojo' ? 'text-red-400' : e.to_val === 'verde' ? 'text-emerald-400' : 'text-amber-400'}>{e.from_val} → {e.to_val}</span>
                          {e.reason && <span className="text-zinc-600"> · {e.reason}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Historial de versiones */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 mb-2">Historial de versiones</h3>
                  {evLoading ? <p className="text-xs text-zinc-500">Cargando…</p> : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {versiones.length === 0 && <p className="text-xs text-zinc-600">Sin cambios de versión.</p>}
                      {versiones.map(e => (
                        <div key={e.id} className="text-xs">
                          <span className="text-zinc-500">{new Date(e.at).toLocaleString()}</span>{' '}
                          <span className="text-white font-mono">v{e.from_val || '—'} → v{e.to_val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
