import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { ServiciosClient } from "@/components/panel/ServiciosClient";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  let services: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    duration_minutes: number;
    active: boolean;
    sort_order: number;
  }[] = [];

  if (admin) {
    const { data, error } = await admin
      .from("bookido_services")
      .select("id, name, description, price, duration_minutes, active, sort_order")
      .eq("tenant_slug", tenant)
      .order("sort_order", { ascending: true });
    if (error && error.message?.includes("column")) {
      // Fallback: table exists but new columns not yet migrated
      const { data: base } = await admin
        .from("bookido_services")
        .select("id, name, duration_minutes, active, sort_order")
        .eq("tenant_slug", tenant)
        .order("sort_order", { ascending: true });
      services = (base ?? []).map((s) => ({ ...s, description: null, price: null })) as typeof services;
    } else {
      services = (data ?? []) as typeof services;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-7">
        <h1 className="font-future text-2xl font-semibold text-white">Servicios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {services.length} servicio{services.length !== 1 ? "s" : ""} — los cambios se
          reflejan en el calendario al instante.
        </p>
      </div>

      <ServiciosClient services={services} />
    </div>
  );
}
