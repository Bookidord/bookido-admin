import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { LandingPage } from "@/components/landing/LandingPage";
import { buildThemeStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

function computeIsOpenNow(hours: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[]): boolean | null {
  if (!hours.length) return null;
  const now = new Date();
  // Use UTC as proxy — no tenant TZ stored yet
  const day = now.getUTCDay(); // 0=Sun
  const hhmm = now.getUTCHours() * 60 + now.getUTCMinutes();
  const today = hours.find((h) => h.day_of_week === day);
  if (!today) return null;
  if (today.is_closed) return false;
  const [oh, om] = today.open_time.split(":").map(Number);
  const [ch, cm] = today.close_time.split(":").map(Number);
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

  const { data: landing } = await admin
    .from("bookido_landings")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .maybeSingle();

  if (!landing || !landing.is_active) {
    redirect("/reserva");
  }

  // Parallel data fetches
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { data: services },
    { data: hoursRows },
    { data: lastBooking },
    { count: weekCount },
    mediaBlob,
  ] = await Promise.all([
    admin.from("bookido_services")
      .select("id, name, duration_minutes, price, description")
      .eq("tenant_slug", tenantSlug)
      .eq("active", true)
      .order("sort_order"),
    admin.from("bookido_business_hours")
      .select("day_of_week, open_time, close_time, is_closed")
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
    admin.storage.from("bookido-media").download(`config/${tenantSlug}.json`).catch(() => ({ data: null })),
  ]);

  let mediaConfig: Record<string, unknown> = {};
  try {
    if (mediaBlob?.data) {
      const text = await mediaBlob.data.text();
      mediaConfig = JSON.parse(text);
    }
  } catch { /* no config yet */ }

  const fomoLastMinutes = lastBooking?.created_at
    ? Math.floor((Date.now() - new Date(lastBooking.created_at).getTime()) / 60000)
    : null;

  const isOpenNow = computeIsOpenNow(hoursRows ?? []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: buildThemeStyle({ hero: landing.hero_color }) }} />
      <LandingPage
        landing={{ ...landing, ...mediaConfig }}
        bookingUrl="/reserva"
        services={services ?? []}
        isOpenNow={isOpenNow}
        fomoLastMinutes={fomoLastMinutes}
        fomoWeekCount={weekCount ?? 0}
      />
    </>
  );
}
