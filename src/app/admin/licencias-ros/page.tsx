'use client';
import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface Licencia {
  id: string; license_key: string; restaurante_nombre: string; plan: string; estado: string;
  fecha_inicio: string; fecha_fin: string; monto_rd: number; pagado: boolean;
  contacto_nombre: string; contacto_telefono: string; dia_cobro: number;
  auto_renovar: boolean; hostname: string; ip_local: string; anydesk_id: string;
  historial_pagos: any[]; updated_at: string; created_at: string;
  // Telemetría (server/telemetry.js → ros_licencias). Opcionales: pueden no existir aún.
  app_version?: string; last_checkin?: string | null; telemetry_at?: string | null;
  app_status?: string | null; printer_status?: string | null; printer_detail?: string | null;
  print_queue_pending?: number | null; last_sale_at?: string | null; disk_free_mb?: number | null;
}

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

  const ec: Record<string, string> = { activa: 'bg-green-500/20 text-green-400', suspendida: 'bg-red-500/20 text-red-400', expirada: 'bg-yellow-500/20 text-yellow-400', trial: 'bg-blue-500/20 text-blue-400' };

  if (loading) return <div className="p-8 text-center text-zinc-500">Cargando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-white">Licencias ROS Pro</h1><p className="text-sm text-zinc-500">{licencias.length} restaurante{licencias.length !== 1 ? 's' : ''}</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">+ Nueva Licencia</button>
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
        {licencias.map(lic => { const d = diasRestantes(lic.fecha_fin); const sem = semaforo(lic); return (
          <div key={lic.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2.5">
                <span title={`${sem.label}${sem.reasons.length ? ' — ' + sem.reasons.join(' · ') : ''}`} className={`mt-1.5 w-3 h-3 shrink-0 rounded-full ${sem.dot} ${sem.level !== 'verde' ? 'animate-pulse' : ''}`} />
                <div><h3 className="text-lg font-bold text-white">{lic.restaurante_nombre}</h3><p className="text-xs text-zinc-600 font-mono mt-1">Key: {lic.license_key}</p></div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${ec[lic.estado] || 'bg-zinc-800 text-zinc-400'}`}>{lic.estado.toUpperCase()}</span>
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
            <div className="flex gap-2 mt-4">
              {lic.estado === 'activa' && <button onClick={() => cambiarEstado(lic.id, 'suspendida')} className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30">Suspender</button>}
              {lic.estado === 'suspendida' && <button onClick={() => cambiarEstado(lic.id, 'activa')} className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30">Reactivar</button>}
              {(lic.estado === 'expirada' || d <= 5) && <button onClick={() => renovar(lic)} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg hover:bg-yellow-500/30">Renovar (+{PLANES[lic.plan]?.meses || 1}m)</button>}
              {lic.contacto_telefono && <a href={`https://wa.me/${lic.contacto_telefono.replace(/[^0-9]/g, '')}`} target="_blank" className="px-3 py-1.5 bg-green-800/30 text-green-300 text-xs font-bold rounded-lg">WhatsApp</a>}
            </div>
          </div>
        ); })}
      </div>
    </div>
  );
}
