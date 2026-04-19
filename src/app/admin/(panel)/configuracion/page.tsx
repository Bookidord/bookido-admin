import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { AdminConfigClient } from "@/components/admin/AdminConfigClient";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  const admin = createServiceSupabaseClient();
  let alertDays = 15;

  if (admin) {
    const { data } = await admin
      .from("bookido_admin_config")
      .select("alert_days")
      .eq("id", 1)
      .single();
    alertDays = (data as { alert_days?: number } | null)?.alert_days ?? 15;
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-7">
        <h1 className="font-future text-2xl font-semibold text-white">Configuración</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ajustes del panel de administración.
        </p>
      </div>
      <AdminConfigClient alertDays={alertDays} adminEmail={process.env.ADMIN_EMAIL ?? ""} />
    </div>
  );
}
