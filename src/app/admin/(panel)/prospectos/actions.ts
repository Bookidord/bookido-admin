'use server';
// Pipeline de captación ROS Pro — mutaciones (service role, solo servidor).
import { createServiceSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const PATH = '/admin/prospectos';
export const ACTIVOS = ['nuevo', 'contactado', 'demo', 'prueba'];

function db() {
  const c = createServiceSupabaseClient();
  if (!c) throw new Error('Supabase no configurado');
  return c;
}

export async function crearProspecto(input: {
  nombre: string; restaurante: string; telefono: string; zona: string; canal: string; notas: string;
}) {
  const restaurante = (input.restaurante || '').trim();
  const nombre = (input.nombre || '').trim();
  if (!restaurante && !nombre) return { error: 'Nombre o restaurante requerido' };
  const now = new Date().toISOString();
  const { error } = await db().from('ros_prospectos').insert({
    nombre, restaurante,
    telefono: (input.telefono || '').trim(),
    zona: (input.zona || '').trim(),
    canal: input.canal || 'otro',
    notas: (input.notas || '').trim(),
    estado: 'nuevo',
    ultimo_contacto: now,
    historial: [{ estado: 'nuevo', at: now }],
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function moverEstado(id: string, estado: string, motivo?: string) {
  const c = db();
  const { data: cur, error: e1 } = await c.from('ros_prospectos').select('estado,historial').eq('id', id).single();
  if (e1) return { error: e1.message };
  const hist = Array.isArray(cur?.historial) ? [...cur.historial] : [];
  const now = new Date().toISOString();
  if (cur?.estado !== estado) hist.push({ estado, at: now });
  const patch: Record<string, unknown> = { estado, historial: hist, ultimo_contacto: now, updated_at: now };
  patch.motivo_perdido = estado === 'perdido' ? (motivo || '') : '';
  const { error } = await c.from('ros_prospectos').update(patch).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

// "Registrar contacto": resetea el reloj de seguimiento (quita el badge de 3 días).
export async function registrarContacto(id: string) {
  const now = new Date().toISOString();
  const { error } = await db().from('ros_prospectos').update({ ultimo_contacto: now, updated_at: now }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function borrarProspecto(id: string) {
  const { error } = await db().from('ros_prospectos').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

// Al pasar a "pagando": crea la licencia en ros_licencias y la enlaza al prospecto.
export async function crearLicenciaDesdeProspecto(id: string) {
  const c = db();
  const { data: p, error: e1 } = await c.from('ros_prospectos').select('*').eq('id', id).single();
  if (e1 || !p) return { error: e1?.message || 'Prospecto no encontrado' };
  if (p.licencia_id) return { error: 'Este prospecto ya tiene licencia' };
  const baseNombre = (p.restaurante || p.nombre || 'cliente').trim();
  const slug = baseNombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 36) + '-' + crypto.randomBytes(2).toString('hex');
  const key = 'ros-' + crypto.randomBytes(10).toString('hex');
  const hoy = new Date(); const fin = new Date(); fin.setMonth(fin.getMonth() + 1);
  const { data: lic, error } = await c.from('ros_licencias').insert({
    license_key: key,
    restaurante_nombre: baseNombre,
    restaurante_slug: slug,
    plan: 'mensual',
    estado: 'activa',
    fecha_inicio: hoy.toISOString().slice(0, 10),
    fecha_fin: fin.toISOString().slice(0, 10),
    contacto_nombre: p.nombre || '',
    contacto_telefono: p.telefono || '',
  }).select('id,license_key').single();
  if (error) return { error: 'No se pudo crear la licencia: ' + error.message };

  const now = new Date().toISOString();
  const hist = Array.isArray(p.historial) ? [...p.historial] : [];
  if (p.estado !== 'pagando') hist.push({ estado: 'pagando', at: now });
  await c.from('ros_prospectos').update({
    estado: 'pagando', licencia_id: lic.id, historial: hist, ultimo_contacto: now, updated_at: now,
  }).eq('id', id);
  revalidatePath(PATH);
  return { ok: true, license_key: lic.license_key };
}
