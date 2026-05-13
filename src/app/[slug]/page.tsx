import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { LandingPage, type ProductItem } from "@/components/landing/LandingPage";
import { buildThemeStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

/** Cached so generateMetadata and the page share one Supabase round-trip. */
const getLandingMeta = cache(async (slug: string) => {
  const admin = createServiceSupabaseClient();
  if (!admin) return null;
  const { data } = await admin
    .from("bookido_landings")
    .select("business_name, tagline, description, photo_url_1, is_active")
    .eq("tenant_slug", slug)
    .maybeSingle();
  return data;
});

/** Slugs that belong to Next.js routes — never treat as tenant. */
const RESERVED_SLUGS = new Set([
  "registro", "login", "panel", "reserva", "admin", "api", "empezar",
  "ayuda", "auth", "reset-password", "forgot-password", "expired",
  "suspended", "app", "dashboard", "nuevo", "demo", "wa",
]);

function computeIsOpenNow(hours: { day_of_week: number; is_open: boolean; slots: { open: string; close: string }[] }[]): boolean | null {
  if (!hours.length) return null;
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

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const BASE = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "bookido.online";
  const canonical = `https://${BASE}/${slug}`;
  const meta = await getLandingMeta(slug);
  if (!meta?.is_active) return { alternates: { canonical } };

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

export default async function TenantPathPage({ params }: Props) {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug)) notFound();

  const admin = createServiceSupabaseClient();
  if (!admin) notFound();

  const [{ data: landing }, { data: tenantRow }] = await Promise.all([
    admin.from("bookido_landings").select("*").eq("tenant_slug", slug).maybeSingle(),
    admin.from("tenants").select("logo_url").eq("slug", slug).maybeSingle(),
  ]);

  if (!landing || !landing.is_active) notFound();

  const landingWithLogo = { ...landing, logo_url: tenantRow?.logo_url ?? null };

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
      .eq("tenant_slug", slug)
      .eq("active", true)
      .order("sort_order"),
    admin.from("bookido_business_hours")
      .select("day_of_week, is_open, slots")
      .eq("tenant_slug", slug),
    admin.from("bookido_bookings")
      .select("created_at")
      .eq("tenant_slug", slug)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("bookido_bookings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", slug)
      .gte("created_at", sevenDaysAgo),
    admin.from("bookido_products")
      .select("id, name, description, price, photo_url")
      .eq("tenant_slug", slug)
      .eq("active", true)
      .order("sort_order"),
  ]);

  const fomoLastMinutes = lastBooking?.created_at
    ? Math.floor((Date.now() - new Date(lastBooking.created_at).getTime()) / 60000)
    : null;

  const isOpenNow = computeIsOpenNow(hoursRows ?? []);

  // Booking goes to the subdomain where the full reserva flow lives
  const BASE = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "bookido.online";
  const bookingUrl = `https://${slug}.${BASE}/reserva`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: buildThemeStyle({ hero: landing.hero_color }) }} />
      <LandingPage
        landing={landingWithLogo}
        bookingUrl={bookingUrl}
        services={services ?? []}
        products={(products ?? []) as ProductItem[]}
        isOpenNow={isOpenNow}
        fomoLastMinutes={fomoLastMinutes}
        fomoWeekCount={weekCount ?? 0}
      />
    </>
  );
}
