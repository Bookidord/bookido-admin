import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { AdminConfigClient } from "@/components/admin/AdminConfigClient";

export const dynamic = "force-dynamic";

const BOOKIDO_API = process.env.BOOKIDO_V2_URL ?? "http://localhost:4000";
const ADMIN_KEY   = process.env.ADMIN_API_KEY   ?? "";

type SystemStatus = {
  sqlite: { ok: boolean; businesses: number; reservas: number; leads: number } | null;
  supabase: boolean;
  wa: { connected: boolean; user: string } | null;
  resend: boolean;
  timestamp: string;
};

async function getSystemStatus(): Promise<SystemStatus> {
  const [sqliteRes, waRes, resendRes, supabaseOk] = await Promise.allSettled([
    fetch(`${BOOKIDO_API}/api/admin-panel/system-status`, {
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
    fetch("http://localhost:3001/status", {
      headers: { "x-api-key": "bookido-wa-key-2026" },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    }),
    fetch("https://api.resend.com/emails?limit=1", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
    (async () => {
      const admin = createServiceSupabaseClient();
      if (!admin) return false;
      const { error } = await admin.from("bookido_admin_config").select("id").eq("id", 1).single();
      return !error;
    })(),
  ]);

  const sqlite =
    sqliteRes.status === "fulfilled" && sqliteRes.value.ok
      ? await sqliteRes.value.json().then((d: { sqlite: SystemStatus["sqlite"] }) => d.sqlite).catch(() => null)
      : null;

  const wa =
    waRes.status === "fulfilled" && waRes.value.ok
      ? await waRes.value.json().then((d: { connected: boolean; user: string }) => ({
          connected: d.connected,
          user: d.user ?? "—",
        })).catch(() => null)
      : null;

  const resend =
    resendRes.status === "fulfilled" && resendRes.value.ok;

  const supabase = supabaseOk.status === "fulfilled" ? supabaseOk.value : false;

  return { sqlite, supabase, wa, resend, timestamp: new Date().toISOString() };
}

export default async function AdminConfiguracionPage() {
  const admin = createServiceSupabaseClient();
  let alertDays = 15;

  const [status] = await Promise.all([
    getSystemStatus(),
    (async () => {
      if (!admin) return;
      const { data } = await admin.from("bookido_admin_config").select("alert_days").eq("id", 1).single();
      alertDays = (data as { alert_days?: number } | null)?.alert_days ?? 15;
    })(),
  ]);

  return (
    <div className="mx-auto max-w-xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-7">
        <h1 className="font-future text-2xl font-semibold text-white">Configuración</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ajustes del panel y estado del sistema.
        </p>
      </div>
      <AdminConfigClient alertDays={alertDays} adminEmail={process.env.ADMIN_EMAIL ?? ""} systemStatus={status} />
    </div>
  );
}
