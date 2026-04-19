import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { LandingPage } from "@/components/landing/LandingPage";
import { buildThemeStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function Home() {
  const h = await headers();
  const tenantSlug =
    h.get("x-tenant-slug") ??
    process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG ??
    null;

  if (!tenantSlug) {
    redirect("/registro");
  }

  const admin = createServiceSupabaseClient();

  if (!admin) {
    redirect("/reserva");
  }

  const { data: landing } = await admin
    .from("bookido_landings")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .maybeSingle();

  if (!landing || !landing.is_active) {
    redirect("/reserva");
  }

  const bookingUrl = `/reserva`; // relative — works on any subdomain

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: buildThemeStyle({ hero: landing.hero_color }) }} />
      <LandingPage landing={landing} bookingUrl={bookingUrl} />
    </>
  );
}
