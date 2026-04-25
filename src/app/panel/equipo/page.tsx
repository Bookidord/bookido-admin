import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { EquipoClient } from "@/components/panel/EquipoClient";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  type StaffRow = {
    id: string;
    name: string;
    role: string;
    color: string;
    phone: string | null;
    is_active: boolean;
    sort_order: number;
    bookido_staff_services: { service_id: string }[];
  };

  type ServiceRow = { id: string; name: string; duration_minutes: number };

  let staff: StaffRow[] = [];
  let services: ServiceRow[] = [];

  if (admin) {
    const [staffRes, svcRes] = await Promise.all([
      admin
        .from("bookido_staff")
        .select("id, name, role, color, phone, is_active, sort_order, bookido_staff_services(service_id)")
        .eq("tenant_slug", tenant)
        .order("sort_order", { ascending: true }),
      admin
        .from("bookido_services")
        .select("id, name, duration_minutes")
        .eq("tenant_slug", tenant)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
    ]);
    staff = (staffRes.data ?? []) as StaffRow[];
    services = (svcRes.data ?? []) as ServiceRow[];
  }

  const staffMapped = staff.map((m) => ({
    ...m,
    service_ids: m.bookido_staff_services.map((r) => r.service_id),
  }));

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-7">
        <h1 className="font-future text-2xl font-semibold text-white">Equipo</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {staff.length} miembro{staff.length !== 1 ? "s" : ""} — cada uno con su propio horario y servicios.
        </p>
      </div>
      <EquipoClient staff={staffMapped} services={services} />
    </div>
  );
}
