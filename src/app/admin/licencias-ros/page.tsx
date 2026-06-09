'use client';
import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface Licencia {
  id: string; license_key: string; restaurante_nombre: string; plan: string; estado: string;
  fecha_inicio: string; fecha_fin: string; monto_rd: number; pagado: boolean;
  contacto_nombre: string; contacto_telefono: string; dia_cobro: number;
  auto_renovar: boolean; hostname: string; ip_local: string; anydesk_id: string;
  historial_pagos: any[]; updated_at: string; created_at: string;
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
  useEffect(() => { load(); }, []);

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
        {licencias.map(lic => { const d = diasRestantes(lic.fecha_fin); return (
          <div key={lic.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div><h3 className="text-lg font-bold text-white">{lic.restaurante_nombre}</h3><p className="text-xs text-zinc-600 font-mono mt-1">Key: {lic.license_key}</p></div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${ec[lic.estado] || 'bg-zinc-800 text-zinc-400'}`}>{lic.estado.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
              <div><span className="text-zinc-500">Plan:</span> <span className="text-white font-bold">{PLANES[lic.plan]?.label || lic.plan}</span></div>
              <div><span className="text-zinc-500">Vence:</span> <span className={`font-bold ${d <= 5 ? 'text-red-400' : d <= 15 ? 'text-yellow-400' : 'text-green-400'}`}>{lic.fecha_fin} ({d}d)</span></div>
              <div><span className="text-zinc-500">Monto:</span> <span className="text-yellow-400 font-bold">RD${lic.monto_rd?.toLocaleString()}</span></div>
              <div><span className="text-zinc-500">Contacto:</span> <span className="text-white">{lic.contacto_telefono || '—'}</span></div>
            </div>
            {lic.hostname && <div className="mt-3 text-xs text-zinc-600">PC: {lic.hostname} · IP: {lic.ip_local} · AnyDesk: {lic.anydesk_id || '—'} · Check: {lic.updated_at ? new Date(lic.updated_at).toLocaleString() : '—'}</div>}
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
