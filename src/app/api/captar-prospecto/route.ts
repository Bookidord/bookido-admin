import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/admin';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const norm = (raw: string) => { const d = String(raw || '').replace(/[^0-9]/g, ''); return d.length >= 7 ? d : ''; };

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }

export async function POST(req: NextRequest) {
  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'json inválido' }, { status: 400, headers: CORS }); }
  if (String(b?.website || '') !== '') return NextResponse.json({ ok: true }, { status: 200, headers: CORS }); // honeypot: fingir éxito
  const s = (v: any, max: number) => (v == null ? '' : typeof v !== 'string' ? null : v.trim().slice(0, max));
  const nombre = s(b?.nombre, 120), restaurante = s(b?.restaurante, 120), zona = s(b?.zona, 60);
  if (nombre === null || restaurante === null || zona === null) return NextResponse.json({ error: 'campo inválido' }, { status: 400, headers: CORS });
  if (!restaurante && !nombre) return NextResponse.json({ error: 'Falta nombre o restaurante' }, { status: 400, headers: CORS });
  const telefono = norm(b?.telefono);
  if (!telefono) return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400, headers: CORS });

  const db = createServiceSupabaseClient();
  if (!db) return NextResponse.json({ error: 'server' }, { status: 500, headers: CORS });
  const now = new Date().toISOString();
  const { data: existentes } = await db.from('ros_prospectos').select('id,telefono');
  const dup = (existentes || []).find((p: any) => norm(p.telefono) === telefono);
  if (dup) {
    await db.from('ros_prospectos').update({ ultimo_contacto: now, updated_at: now }).eq('id', dup.id);
    return NextResponse.json({ ok: true, dedup: true }, { status: 200, headers: CORS });
  }
  const { error } = await db.from('ros_prospectos').insert({
    nombre, restaurante, telefono, zona, canal: 'e-CF landing', estado: 'nuevo',
    notas: 'Vino por la landing e-CF', ultimo_contacto: now,
    historial: [{ estado: 'nuevo', at: now }],
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { status: 200, headers: CORS });
}
