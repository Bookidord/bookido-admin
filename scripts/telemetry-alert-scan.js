#!/usr/bin/env node
/**
 * telemetry-alert-scan.js — Alertas de salud de ROS Pro (corre en bookido-vps)
 * ---------------------------------------------------------------------------
 * Vive junto al panel (bookido-admin) porque necesita: (a) leer/escribir
 * ros_licencias/ros_telemetry_meta con la service_role, y (b) enviar WhatsApp
 * por el wa-gateway local (127.0.0.1:3001), que YA existe.
 *
 * MODOS (por argumento):
 *   (sin args)    Barrido de transiciones: alerta en cambio de nivel (dedup por
 *                 telemetry_alert_level). Al terminar escribe meta.last_scan_at.
 *   --heartbeat   Watchdog: si last_scan_at está viejo (>15 min) alerta que el
 *                 BARRIDO se cayó. Dedup: no repite en 30 min.
 *   --summary     Resumen diario: una línea por cliente con su semáforo, o
 *                 "todos verdes". Pensado para las 8am RD (12:00 UTC).
 *
 * Cron sugerido (bookido-vps):
 *   *_/5  * * * *  node .../telemetry-alert-scan.js
 *   *_/10 * * * *  node .../telemetry-alert-scan.js --heartbeat
 *   0    12 * * *  node .../telemetry-alert-scan.js --summary
 *
 * Env (defaults; sobreescribibles para pruebas):
 *   TELEMETRY_RED_MIN=30 TELEMETRY_AMBER_MIN=20 TELEMETRY_QUEUE_MAX=5
 *   TELEMETRY_ALERT_PHONE=447586255903  TELEMETRY_ALERT_TENANT=<slug wa>
 *   TELEMETRY_HEARTBEAT_MAX_MIN=15      (umbral de "barrido caído")
 *   TELEMETRY_ONLY_KEY=<license_key>    (limita el barrido — solo pruebas)
 */

'use strict';
const fs = require('fs');

function loadEnv(path) {
  const env = {};
  try {
    for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  } catch (_) {}
  return env;
}

const E = Object.assign(
  loadEnv('/root/bookido-admin/.env.local'),
  loadEnv('/root/wa-gateway/.env'),
  process.env
);

const SB_URL = (E.NEXT_PUBLIC_SUPABASE_URL || E.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = E.SUPABASE_SERVICE_ROLE_KEY;
const WA_URL = (E.WA_GATEWAY_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const WA_KEY = E.WA_API_KEY;
const ALERT_PHONE = E.TELEMETRY_ALERT_PHONE || '447586255903';
const ALERT_TENANT = E.TELEMETRY_ALERT_TENANT || '';
const ONLY_KEY = E.TELEMETRY_ONLY_KEY || '';
const RED = +(E.TELEMETRY_RED_MIN || 30), AMBER = +(E.TELEMETRY_AMBER_MIN || 20), QUEUE = +(E.TELEMETRY_QUEUE_MAX || 5);
const HEARTBEAT_MAX = +(E.TELEMETRY_HEARTBEAT_MAX_MIN || 15);
const MODE = process.argv.includes('--heartbeat') ? 'heartbeat'
           : process.argv.includes('--summary') ? 'summary' : 'scan';

const EMOJI = { verde: '🟢', ambar: '🟡', rojo: '🔴' };
const now = () => new Date();
const iso = () => now().toISOString();

function semaforo(row) {
  const stamp = row.telemetry_at || row.last_checkin || null;
  const ageMin = stamp ? (Date.now() - new Date(stamp).getTime()) / 60000 : null;
  if (ageMin === null || ageMin > RED) {
    return { level: 'rojo', reasons: [ageMin === null ? 'sin ping registrado' : `sin ping hace ${Math.round(ageMin)} min`] };
  }
  const pending = row.print_queue_pending ?? 0;
  const reasons = [];
  if (row.printer_status === 'fail') reasons.push('impresora en fallo');
  if (pending > QUEUE) reasons.push(`cola: ${pending} pendientes`);
  if (ageMin > AMBER) reasons.push(`ping hace ${Math.round(ageMin)} min`);
  if (reasons.length) return { level: 'ambar', reasons };
  return { level: 'verde', reasons: [] };
}

async function sb(path, method = 'GET', body = null, prefer = '') {
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  else if (method === 'PATCH') headers.Prefer = 'return=minimal';
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  return { ok: res.ok, status: res.status, json: txt ? (() => { try { return JSON.parse(txt); } catch { return txt; } })() : null };
}

async function metaGet(k) {
  const r = await sb(`ros_telemetry_meta?k=eq.${encodeURIComponent(k)}&select=v,updated_at&limit=1`);
  const a = Array.isArray(r.json) ? r.json : [];
  return a[0] || null;
}
async function metaSet(k, v) {
  await sb('ros_telemetry_meta?on_conflict=k', 'POST', [{ k, v, updated_at: iso() }], 'resolution=merge-duplicates,return=minimal');
}

async function sendWhatsApp(text) {
  const body = { phone: ALERT_PHONE, message: text };
  if (ALERT_TENANT) body.tenant = ALERT_TENANT;
  const res = await fetch(`${WA_URL}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': WA_KEY },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  return { ok: res.ok, status: res.status, body: txt };
}

async function fetchLicencias() {
  let q = 'ros_licencias?select=id,license_key,restaurante_nombre,estado,printer_status,print_queue_pending,last_sale_at,telemetry_at,last_checkin,telemetry_alert_level';
  if (ONLY_KEY) q += `&license_key=eq.${encodeURIComponent(ONLY_KEY)}`;
  const r = await sb(q);
  if (!r.ok) throw new Error('Supabase read fail ' + r.status);
  return Array.isArray(r.json) ? r.json : [];
}

// ── MODO scan: transiciones de nivel ────────────────────────────────────────
async function runScan() {
  const rows = await fetchLicencias();
  const fired = [];
  for (const row of rows) {
    const sem = semaforo(row);
    const prev = row.telemetry_alert_level || 'verde';
    if (sem.level === prev) continue;
    const name = row.restaurante_nombre || row.license_key;
    const recuperado = sem.level === 'verde';
    const titulo = recuperado ? `${EMOJI.verde} ROS Pro — ${name}: RECUPERADO` : `${EMOJI[sem.level]} ROS Pro — ${name}: ${sem.level.toUpperCase()}`;
    const motivo = sem.reasons.length ? sem.reasons.join('; ') : 'todo OK';
    const msg = `${titulo}\nNivel: ${prev} → ${sem.level}\nMotivo: ${motivo}\n${iso()}`;
    let delivered = 'no-enviado';
    try { const wa = await sendWhatsApp(msg); delivered = wa.ok ? `whatsapp(${ALERT_PHONE})` : `wa-fail ${wa.status}`; }
    catch (e) { delivered = 'wa-error: ' + e.message; }
    await sb(`ros_licencias?id=eq.${row.id}`, 'PATCH', { telemetry_alert_level: sem.level, telemetry_alert_at: iso() });
    fired.push(`${name}: ${prev}->${sem.level} [${delivered}]`);
  }
  // Latido del propio barrido (lo vigila --heartbeat)
  await metaSet('last_scan_at', iso());
  console.log(iso(), `| scan ${rows.length} licencia(s)${ONLY_KEY ? ' (filtrado)' : ''} |`, fired.length ? fired.join(' , ') : 'sin transiciones');
}

// ── MODO heartbeat: ¿el barrido dejó de correr? ─────────────────────────────
async function runHeartbeat() {
  const m = await metaGet('last_scan_at');
  const ageMin = m && m.v ? (Date.now() - new Date(m.v).getTime()) / 60000 : null;
  const caido = ageMin === null || ageMin > HEARTBEAT_MAX;
  if (!caido) { console.log(iso(), `| heartbeat OK — último barrido hace ${Math.round(ageMin)} min`); return; }

  // Dedup: no repetir la alerta de heartbeat en 30 min
  const last = await metaGet('last_heartbeat_alert');
  const sinceAlert = last && last.v ? (Date.now() - new Date(last.v).getTime()) / 60000 : Infinity;
  if (sinceAlert < 30) { console.log(iso(), `| heartbeat CAÍDO pero ya avisado hace ${Math.round(sinceAlert)} min`); return; }

  const detalle = ageMin === null ? 'nunca registró un barrido' : `último barrido hace ${Math.round(ageMin)} min (> ${HEARTBEAT_MAX})`;
  const msg = `⚠️ ROS Pro — ALERTA de sistema\nEl barrido de telemetría NO está corriendo.\n${detalle}\nRevisar el cron telemetry-alert-scan en bookido-vps.\n${iso()}`;
  let delivered = 'no-enviado';
  try { const wa = await sendWhatsApp(msg); delivered = wa.ok ? `whatsapp(${ALERT_PHONE})` : `wa-fail ${wa.status}`; }
  catch (e) { delivered = 'wa-error: ' + e.message; }
  await metaSet('last_heartbeat_alert', iso());
  console.log(iso(), `| heartbeat CAÍDO — alerta enviada [${delivered}] (${detalle})`);
}

// ── MODO summary: resumen diario ────────────────────────────────────────────
async function runSummary() {
  const rows = await fetchLicencias();
  const evals = rows.map(r => ({ name: r.restaurante_nombre || r.license_key, sem: semaforo(r) }));
  const problemas = evals.filter(e => e.sem.level !== 'verde');
  let msg;
  if (!problemas.length) {
    msg = `📊 ROS Pro — Resumen diario (8am RD)\n✅ Todos verdes (${evals.length} cliente${evals.length !== 1 ? 's' : ''}).`;
  } else {
    const lineas = evals
      .sort((a, b) => (a.sem.level === 'rojo' ? 0 : a.sem.level === 'ambar' ? 1 : 2) - (b.sem.level === 'rojo' ? 0 : b.sem.level === 'ambar' ? 1 : 2))
      .map(e => `${EMOJI[e.sem.level]} ${e.name}: ${e.sem.level}${e.sem.reasons.length ? ' — ' + e.sem.reasons.join('; ') : ''}`);
    msg = `📊 ROS Pro — Resumen diario (8am RD)\n${lineas.join('\n')}`;
  }
  let delivered = 'no-enviado';
  try { const wa = await sendWhatsApp(msg); delivered = wa.ok ? `whatsapp(${ALERT_PHONE})` : `wa-fail ${wa.status}`; }
  catch (e) { delivered = 'wa-error: ' + e.message; }
  await metaSet('last_daily_summary', iso());
  console.log(iso(), `| resumen diario enviado [${delivered}] | ${evals.length} clientes, ${problemas.length} con problema`);
}

(async () => {
  if (!SB_URL || !SB_KEY) { console.error(iso(), 'FALTAN credenciales Supabase'); process.exit(1); }
  try {
    if (MODE === 'heartbeat') await runHeartbeat();
    else if (MODE === 'summary') await runSummary();
    else await runScan();
  } catch (e) {
    console.error(iso(), 'ERROR:', e.message);
    process.exit(1);
  }
})();
