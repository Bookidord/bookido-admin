import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { ClientesTable } from "@/components/admin/ClientesTable";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const admin = createServiceSupabaseClient();

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
  };

  let clientes: ClienteRow[] = [];
  let plans: { id: string; name: string; duration_days: number; price_rd: number | null }[] = [];

  if (admin) {
    const [
      { data: tenantsData },
      { data: subsData },
      { data: plansData },
    ] = await Promise.all([
      admin.from("tenants").select("slug, name").order("created_at"),
      admin.from("bookido_subscriptions")
        .select("id, tenant_slug, plan_id, start_date, end_date, status")
        .order("created_at", { ascending: false }),
      admin.from("bookido_plans").select("id, name, duration_days, price_rd").order("duration_days"),
    ]);

    plans = plansData ?? [];

    const planMap: Record<string, string> = {};
    plans.forEach(p => { planMap[p.id] = p.name; });

    // Most recent subscription per tenant
    const latestSub: Record<string, typeof subsData extends (infer T)[] | null ? T : never> = {};
    subsData?.forEach(s => {
      if (!latestSub[s.tenant_slug]) latestSub[s.tenant_slug] = s;
    });

    clientes = (tenantsData ?? []).map(t => {
      const sub = latestSub[t.slug];
      return {
        slug: t.slug,
        business_name: (t as { name: string }).name,
        email: "",
        subscription_id: sub?.id ?? null,
        plan_id: sub?.plan_id ?? null,
        plan_name: sub?.plan_id ? (planMap[sub.plan_id] ?? null) : null,
        start_date: sub?.start_date ?? null,
        end_date: sub?.end_date ?? null,
        sub_status: sub?.status ?? null,
      };
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <ClientesTable clientes={clientes} plans={plans} />
    </div>
  );
}
