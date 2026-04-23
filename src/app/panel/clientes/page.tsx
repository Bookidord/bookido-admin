import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { ClientList } from "@/components/panel/ClientList";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  type RawBooking = {
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    status: string;
    starts_at: string;
  };

  let rawBookings: RawBooking[] = [];

  if (admin) {
    const { data } = await admin
      .from("bookido_bookings")
      .select("customer_name, customer_email, customer_phone, status, starts_at")
      .eq("tenant_slug", tenant)
      .order("starts_at", { ascending: false });

    rawBookings = data ?? [];
  }

  // Aggregate by email
  const map: Record<
    string,
    {
      email: string;
      name: string;
      phone: string | null;
      total: number;
      confirmed: number;
      completed: number;
      lastAt: string;
    }
  > = {};

  for (const b of rawBookings) {
    const key = b.customer_email.toLowerCase();
    if (!map[key]) {
      map[key] = {
        email: b.customer_email,
        name: b.customer_name,
        phone: b.customer_phone,
        total: 0,
        confirmed: 0,
        completed: 0,
        lastAt: b.starts_at,
      };
    }
    map[key].total++;
    if (b.status === "confirmed") map[key].confirmed++;
    if (b.status === "completed") map[key].completed++;
    // lastAt already points to the most recent (sorted desc)
  }

  const clients = Object.values(map).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-6">
        <h1 className="font-future text-2xl font-semibold text-white">Clientes</h1>
        <p className="mt-0.5 text-sm text-zinc-500">{clients.length} cliente{clients.length !== 1 ? "s" : ""} únicos</p>
      </div>
      <ClientList clients={clients} />
    </div>
  );
}
