import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { CampanaForm } from "@/components/panel/CampanaForm";

export const dynamic = "force-dynamic";

export default async function CampanasPage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  type Client = { name: string; email: string; phone: string | null; total: number };
  let clients: Client[] = [];

  if (admin) {
    const { data } = await admin
      .from("bookido_bookings")
      .select("customer_name, customer_email, customer_phone")
      .eq("tenant_slug", tenant)
      .order("starts_at", { ascending: false });

    const map: Record<string, Client> = {};
    for (const b of data ?? []) {
      const key = b.customer_email.toLowerCase();
      if (!map[key]) {
        map[key] = { name: b.customer_name, email: b.customer_email, phone: b.customer_phone, total: 0 };
      }
      map[key].total++;
    }
    clients = Object.values(map);
  }

  const vip     = clients.filter((c) => c.total >= 10).length;
  const regular = clients.filter((c) => c.total >= 4 && c.total < 10).length;
  const nuevo   = clients.filter((c) => c.total < 4).length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-future text-2xl font-semibold text-white">Campañas</h1>
        <p className="text-sm text-zinc-500">
          {clients.length} clientes en tu base de datos ·{" "}
          <span className="text-amber-400">{vip} VIP</span> ·{" "}
          <span className="text-[#14F195]">{regular} regulares</span> ·{" "}
          <span className="text-zinc-400">{nuevo} nuevos</span>
        </p>
      </div>
      <CampanaForm clients={clients} tenantSlug={tenant} />
    </div>
  );
}
