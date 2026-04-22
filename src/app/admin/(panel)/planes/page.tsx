import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { PlanesClient } from "@/components/admin/PlanesClient";

export const dynamic = "force-dynamic";

export default async function PlanesPage() {
  const admin = createServiceSupabaseClient();
  let plans: { id: string; name: string; duration_days: number; price_rd: number | null }[] = [];

  if (admin) {
    const { data } = await admin
      .from("bookido_plans")
      .select("id, name, duration_days, price_rd")
      .order("duration_days");
    plans = data ?? [];
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-7">
        <h1 className="font-future text-2xl font-semibold text-white">Planes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edita los precios de cada plan. Los cambios aplican a nuevas renovaciones.
        </p>
      </div>
      <PlanesClient plans={plans} />
    </div>
  );
}
