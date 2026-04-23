import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { CalendarView } from "@/components/panel/CalendarView";
import { startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string; month?: string }>;

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { year, month } = await searchParams;
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  const now = new Date();
  const y = parseInt(year ?? String(now.getFullYear()), 10);
  const m = parseInt(month ?? String(now.getMonth() + 1), 10);

  // Build the month range
  const monthStart = startOfMonth(new Date(y, m - 1, 1));
  const monthEnd = endOfMonth(new Date(y, m - 1, 1));

  type Booking = {
    id: string;
    starts_at: string;
    ends_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    notes: string | null;
    status: string;
    service_id: string | null;
    service_name: string;
  };

  let bookings: Booking[] = [];

  if (admin) {
    const { data } = await admin
      .from("bookido_bookings")
      .select("id, starts_at, ends_at, customer_name, customer_email, customer_phone, notes, status, service_id")
      .eq("tenant_slug", tenant)
      .gte("starts_at", monthStart.toISOString())
      .lte("starts_at", monthEnd.toISOString())
      .order("starts_at", { ascending: true });

    const { data: services } = await admin
      .from("bookido_services")
      .select("id, name")
      .eq("tenant_slug", tenant);

    const svcMap: Record<string, string> = {};
    services?.forEach((s) => { svcMap[s.id] = s.name; });

    bookings = (data ?? []).map((b) => ({
      ...b,
      service_name: b.service_id ? (svcMap[b.service_id] ?? "—") : "—",
    }));
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-6">
        <h1 className="font-future text-2xl font-semibold text-white">Calendario</h1>
        <p className="mt-0.5 text-sm text-zinc-500">{bookings.length} reserva{bookings.length !== 1 ? "s" : ""} este mes</p>
      </div>
      <CalendarView bookings={bookings} year={y} month={m} />
    </div>
  );
}
