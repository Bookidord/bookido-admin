#!/usr/bin/env node
/**
 * captacion-digest.js — Digest diario del pipeline de captación (corre en bookido-vps).
 * Lee ros_prospectos y manda UN WhatsApp INTERNO a Johanny (vía wa-gateway) con los
 * leads del día y a quién seguir. Baileys aquí es OK: es a Johanny, no a prospectos.
 * Cron sugerido: 30 12 * * *  (8:30am RD)
 */
'use strict';
const fs = require('fs');
function loadEnv(path) {
  const e = {};
  try {
    for (const l of fs.readFileSync(path, 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      e[m[1]] = v;
    }
  } catch (_) {}
  return e;
}
const E = Object.assign(loadEnv('/root/bookido-admin/.env.local'), loadEnv('/root/wa-gateway/.env'), process.env);
const SB_URL = (E.NEXT_PUBLIC_SUPABASE_URL || E.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = E.SUPABASE_SERVICE_ROLE_KEY;
const WA_URL = (E.WA_GATEWAY_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const WA_KEY = E.WA_API_KEY;
const PHONE = E.TELEMETRY_ALERT_PHONE || '447586255903';
const TENANT = E.TELEMETRY_ALERT_TENANT || '';

// construirDigest — idéntico a marketing/lib/digest-core.js
const ACTIVOS = ['nuevo', 'contactado', 'demo', 'prueba'];
function construirDigest(prospectos, hoyISO) {
  const now = new Date(hoyISO).getTime();
  const nuevos = prospectos.filter(p => p.estado === 'nuevo' && (now - new Date(p.ultimo_contacto).getTime()) <= 86400000);
  const pendientes = prospectos.filter(p => ACTIVOS.includes(p.estado) && (now - new Date(p.ultimo_contacto).getTime()) >= 3 * 86400000);
  if (!prospectos.length || (!nuevos.length && !pendientes.length))
    return `📋 Captación — ${hoyISO.slice(0, 10)}\nSin leads nuevos ni seguimientos pendientes hoy.`;
  const line = p => `• ${p.restaurante || '—'} (${p.zona || 's/z'}, ${p.canal})`;
  let m = `📋 Captación — ${hoyISO.slice(0, 10)}\n`;
  m += `\n${nuevos.length} lead(s) nuevo(s):\n` + (nuevos.map(line).join('\n') || '—');
  m += `\n\n${pendientes.length} para seguir (3+ días):\n` + (pendientes.map(line).join('\n') || '—');
  const empieza = [...pendientes, ...nuevos].slice(0, 3);
  if (empieza.length) m += `\n\n👉 Empieza por: ` + empieza.map(p => p.restaurante).join(', ');
  return m;
}

async function sb(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
  return r.ok ? r.json() : [];
}
async function sendWA(text) {
  const body = { phone: PHONE, message: text };
  if (TENANT) body.tenant = TENANT;
  const r = await fetch(`${WA_URL}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': WA_KEY }, body: JSON.stringify(body) });
  return { ok: r.ok, status: r.status, body: await r.text() };
}

(async () => {
  if (!SB_URL || !SB_KEY) { console.error(new Date().toISOString(), 'faltan credenciales Supabase'); process.exit(1); }
  const rows = await sb('ros_prospectos?select=restaurante,zona,canal,estado,ultimo_contacto');
  const arr = Array.isArray(rows) ? rows : [];
  const msg = construirDigest(arr, new Date().toISOString());
  let delivered = 'no-enviado';
  try { const wa = await sendWA(msg); delivered = wa.ok ? `whatsapp(${PHONE})` : `wa-fail ${wa.status}: ${wa.body}`; }
  catch (e) { delivered = 'wa-error: ' + e.message; }
  console.log(new Date().toISOString(), `| digest [${delivered}] | ${arr.length} prospecto(s)`);
})();
