import { ClientesTable } from "@/components/admin/ClientesTable";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type TenantRow = {
  slug: string;
  name: string;
  owner_email: string;
  created_at: string;
};

type ClienteRow = {
  slug: string;
  business_name: string;
  email: string;
  subscription_id: string | null;
  plan_id: string | null;
  plan_name: string | null;
  start_date: string | null;
  end_date: string | null;
  sub_status: string | null;
  is_active?: boolean;
  is_test?: boolean;
  owner_phone?: string | null;
  service_count?: number;
  booking_count_30d?: number;
  created_at?: string | null;
};

export default async function ClientesPage() {
  const admin = createServiceSupabaseClient();

  if (!admin) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm text-red-400">Supabase no configurado.</p>
      </div>
    );
  }

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [tenantsResult, plansResult, subsResult, servicesResult, bookingsResult] = await Promise.all([
    admin.from("tenants").select("slug, name, owner_email, created_at").order("created_at", { ascending: false }),
    admin.from("bookido_plans").select("id, name, duration_days, price_rd").order("duration_days"),
    admin.from("bookido_subscriptions").select("id, tenant_slug, plan_id, start_date, end_date, status").order("created_at", { ascending: false }),
    admin.from("bookido_services").select("tenant_slug"),
    admin.from("bookido_bookings").select("tenant_slug").gte("starts_at", since30.toISOString()),
  ]);

  const tenants = (tenantsResult.data ?? []) as unknown as TenantRow[];
  const plans = (plansResult.data ?? []) as { id: string; name: string; duration_days: number; price_rd: number | null }[];
  const subs = (subsResult.data ?? []) as { id: string; tenant_slug: string; plan_id: string; start_date: string; end_date: string; status: string }[];

  const planMap: Record<string, string> = {};
  plans.forEach(p => { planMap[p.id] = p.name; });

  const latestSub: Record<string, typeof subs[0]> = {};
  subs.forEach(s => {
    if (!latestSub[s.tenant_slug]) latestSub[s.tenant_slug] = s;
  });

  // Aggregate counts in JS (avoid N+1)
  const svcCount: Record<string, number> = {};
  (servicesResult.data ?? []).forEach(s => {
    svcCount[s.tenant_slug] = (svcCount[s.tenant_slug] ?? 0) + 1;
  });
  const bkCount: Record<string, number> = {};
  (bookingsResult.data ?? []).forEach(b => {
    bkCount[b.tenant_slug] = (bkCount[b.tenant_slug] ?? 0) + 1;
  });

  const clientes: ClienteRow[] = tenants.map(t => {
    const sub = latestSub[t.slug];
    return {
      slug: t.slug,
      business_name: t.name,
      email: t.owner_email,
      subscription_id: sub?.id ?? null,
      plan_id: sub?.plan_id ?? null,
      plan_name: sub?.plan_id ? (planMap[sub.plan_id] ?? null) : null,
      start_date: sub?.start_date ?? null,
      end_date: sub?.end_date ?? null,
      sub_status: sub?.status ?? null,
      is_active: true,
      is_test: false,
      owner_phone: null,
      service_count: svcCount[t.slug] ?? 0,
      booking_count_30d: bkCount[t.slug] ?? 0,
      created_at: t.created_at,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <ClientesTable clientes={clientes} plans={plans} />
    </div>
  );
}
