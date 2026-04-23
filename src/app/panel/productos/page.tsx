import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { ProductsManager } from "@/components/panel/ProductsManager";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  const { data: products } = await admin!
    .from("bookido_products")
    .select("id, name, description, price, photo_url, active, sort_order")
    .eq("tenant_slug", tenant)
    .order("sort_order")
    .order("created_at");

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-10">
      <ProductsManager initialProducts={products ?? []} />
    </div>
  );
}
