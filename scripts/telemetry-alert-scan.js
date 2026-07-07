#!/usr/bin/env node
/**
 * telemetry-alert-scan.js — Barrido de alertas de salud (corre en bookido-vps)
 * ---------------------------------------------------------------------------
 * Vive junto al panel (bookido-admin) porque necesita: (a) leer/escribir
 * ros_licencias con la service_role, y (b) enviar WhatsApp por el wa-gateway
 * local (127.0.0.1:3001), que YA existe. La ingesta de Hostinger no puede
 * hacer esto (solo la alcanza un cliente vivo, y no ve el wa-gateway).
 *
 * Lógica: recalcula el semáforo de cada licencia (misma regla que lib.php y el
 * panel) y, SOLO en transición de nivel, notifica por WhatsApp y guarda el
 * nuevo nivel en telemetry_alert_level (dedup → sin spam).
 *
 * Cron sugerido (cada 5 min):
 *   *_/5 * * * * /usr/bin/node /root/bookido-admin/scripts/telemetry-alert-scan.js >> /var/log/ros-telemetry-scan.log 2>&1
 *
 * Env (con defaults; para pruebas se pueden sobreescribir):
 *   TELEMETRY_RED_MIN=30  TELEMETRY_AMBER_MIN=20  TELEMETRY_QUEUE_MAX=5
 *   TELEMETRY_ALERT_PHONE=447586255903     (destino de la alerta)
 *   TELEMETRY_ALERT_TENANT=<slug wa>       (sesión wa-gateway; vacío = primera conectada)
 *   TELEMETRY_ONLY_KEY=<license_key>       (limita el barrido a una licencia — solo pruebas)
 * Credenciales tomadas de /root/bookido-admin/.env.local y /root/wa-gateway/.env.
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

const EMOJI = { verde: '🟢', ambar: '🟡', rojo: '🔴' };

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

async function sb(path, method = 'GET', body = null) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'PATCH' ? 'return=minimal' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  return { ok: res.ok, status: res.status, json: txt ? (() => { try { return JSON.parse(txt); } catch { return txt; } })() : null };
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

(async () => {
  if (!SB_URL || !SB_KEY) { console.error(new Date().toISOString(), 'FALTAN credenciales Supabase'); process.exit(1); }

  let q = 'ros_licencias?select=id,license_key,restaurante_nombre,estado,printer_status,print_queue_pending,last_sale_at,telemetry_at,last_checkin,telemetry_alert_level';
  if (ONLY_KEY) q += `&license_key=eq.${encodeURIComponent(ONLY_KEY)}`;
  const r = await sb(q);
  if (!r.ok) { console.error(new Date().toISOString(), 'Supabase read fail', r.status); process.exit(1); }

  const rows = Array.isArray(r.json) ? r.json : [];
  const fired = [];
  for (const row of rows) {
    const sem = semaforo(row);
    const prev = row.telemetry_alert_level || 'verde';
    if (sem.level === prev) continue; // sin transición → nada

    const name = row.restaurante_nombre || row.license_key;
    const recuperado = sem.level === 'verde';
    const titulo = recuperado ? `${EMOJI.verde} ROS Pro — ${name}: RECUPERADO` : `${EMOJI[sem.level]} ROS Pro — ${name}: ${sem.level.toUpperCase()}`;
    const motivo = sem.reasons.length ? sem.reasons.join('; ') : 'todo OK';
    const msg = `${titulo}\nNivel: ${prev} → ${sem.level}\nMotivo: ${motivo}\n${new Date().toISOString()}`;

    let delivered = 'no-enviado';
    try {
      const wa = await sendWhatsApp(msg);
      delivered = wa.ok ? `whatsapp(${ALERT_PHONE})` : `wa-fail ${wa.status}: ${wa.body}`;
    } catch (e) { delivered = 'wa-error: ' + e.message; }

    // Persistir el nuevo nivel (dedup), aunque el envío falle: evita reintentos infinitos.
    await sb(`ros_licencias?id=eq.${row.id}`, 'PATCH', { telemetry_alert_level: sem.level, telemetry_alert_at: new Date().toISOString() });
    fired.push(`${name}: ${prev}->${sem.level} [${delivered}]`);
  }

  console.log(new Date().toISOString(), `| scan ${rows.length} licencia(s)${ONLY_KEY ? ' (filtrado)' : ''} |`,
    fired.length ? fired.join(' , ') : 'sin transiciones');
})();
