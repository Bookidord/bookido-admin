import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { LandingEditor } from "@/components/panel/LandingEditor";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  const { data: landing } = await admin!
    .from("bookido_landings")
    .select("*")
    .eq("tenant_slug", tenant)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-10">
      <LandingEditor initialData={landing} />
    </div>
  );
}
