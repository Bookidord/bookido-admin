import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { LandingPage, type ProductItem } from "@/components/landing/LandingPage";
import { buildThemeStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const slug = h.get("x-tenant-slug") ?? process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG;
  const BASE = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "bookido.online";
  if (!slug) return {};
  const canonical = `https://${BASE}/${slug}`;

  const admin = createServiceSupabaseClient();
  if (!admin) return { alternates: { canonical } };

  const { data: meta } = await admin
    .from("bookido_landings")
    .select("business_name, tagline, description, photo_url_1")
    .eq("tenant_slug", slug)
    .maybeSingle();

  if (!meta) return { alternates: { canonical } };

  const title = `${meta.business_name} · Bookido`;
  const description =
    meta.description ??
    meta.tagline ??
    `Reserva online en ${meta.business_name}. Elige servicio, fecha y hora en segundos.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      ...(meta.photo_url_1 ? { images: [{ url: meta.photo_url_1 }] } : {}),
    },
  };
}

function computeIsOpenNow(hours: { day_of_week: number; is_open: boolean; slots: { open: string; close: string }[] }[]): boolean | null {
  if (!hours.length) return null;
  // Use Santo Domingo timezone (UTC-4) — where all tenants are based
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santo_Domingo" }));
  const day  = now.getDay();
  const hhmm = now.getHours() * 60 + now.getMinutes();
  const today = hours.find((h) => h.day_of_week === day);
  if (!today || !today.is_open) return false;
  const slot = today.slots?.[0];
  if (!slot) return false;
  const [oh, om] = slot.open.split(":").map(Number);
  const [ch, cm] = slot.close.split(":").map(Number);
  return hhmm >= oh * 60 + om && hhmm < ch * 60 + cm;
}

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

  const [{ data: landing }, { data: tenantRow }] = await Promise.all([
    admin.from("bookido_landings").select("*").eq("tenant_slug", tenantSlug).maybeSingle(),
    admin.from("tenants").select("logo_url").eq("slug", tenantSlug).maybeSingle(),
  ]);

  if (!landing || !landing.is_active) {
    redirect("/reserva");
  }

  const landingWithLogo = { ...landing, logo_url: tenantRow?.logo_url ?? null };

  // Parallel data fetches
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { data: services },
    { data: hoursRows },
    { data: lastBooking },
    { count: weekCount },
    { data: products },
  ] = await Promise.all([
    admin.from("bookido_services")
      .select("id, name, duration_minutes, price, description")
      .eq("tenant_slug", tenantSlug)
      .eq("active", true)
      .order("sort_order"),
    admin.from("bookido_business_hours")
      .select("day_of_week, is_open, slots")
      .eq("tenant_slug", tenantSlug),
    admin.from("bookido_bookings")
      .select("created_at")
      .eq("tenant_slug", tenantSlug)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("bookido_bookings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", tenantSlug)
      .gte("created_at", sevenDaysAgo),
    admin.from("bookido_products")
      .select("id, name, description, price, photo_url")
      .eq("tenant_slug", tenantSlug)
      .eq("active", true)
      .order("sort_order"),
  ]);

  const fomoLastMinutes = lastBooking?.created_at
    ? Math.floor((Date.now() - new Date(lastBooking.created_at).getTime()) / 60000)
    : null;

  const isOpenNow = computeIsOpenNow(hoursRows ?? []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: buildThemeStyle({ hero: landing.hero_color }) }} />
      <LandingPage
        landing={landingWithLogo}
        bookingUrl="/reserva"
        services={services ?? []}
        products={(products ?? []) as ProductItem[]}
        isOpenNow={isOpenNow}
        fomoLastMinutes={fomoLastMinutes}
        fomoWeekCount={weekCount ?? 0}
      />
    </>
  );
}
