import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSsrClient } from "@/lib/supabase/ssr";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { Sidebar } from "@/components/panel/Sidebar";
import { PanelTopBar } from "@/components/panel/PanelTopBar";
import { BookingLiveAlert } from "@/components/panel/BookingLiveAlert";

async function fetchNewsItems(): Promise<string[]> {
  const feeds = [
    "https://listindiario.com/rss",
    "https://diariolibre.com/rss",
    "https://elnacional.com.do/feed/",
  ];
  for (const url of feeds) {
    try {
      const res = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const xml = await res.text();
      const matches = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gm)];
      const items = matches
        .map((m) => m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/<[^>]+>/g, "").trim())
        .filter((t) => t.length > 15 && !t.toLowerCase().includes("listín") && !t.toLowerCase().includes("diario libre") && !t.toLowerCase().includes("el nacional"))
        .slice(0, 12);
      if (items.length >= 3) return items;
    } catch { /* try next */ }
  }
  return [];
}

async function getSubscriptionBanner(tenantSlug: string) {
  const admin = createServiceSupabaseClient();
  if (!admin) return null;

  const { data: sub } = await admin
    .from("bookido_subscriptions")
    .select("status, end_date")
    .eq("tenant_slug", tenantSlug)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return null;

  const today = new Date();
  const endDate = new Date(sub.end_date);
  const daysLeft = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (sub.status === "suspended") {
    return { type: "suspended" as const, daysLeft };
  }
  if (daysLeft < 0) {
    return { type: "expired" as const, daysLeft };
  }
  if (daysLeft <= 15) {
    return { type: "expiring" as const, daysLeft };
  }
  return null;
}

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantSlug = await getTenantSlug();
  const newsItems = await fetchNewsItems();

  // Allow superadmin impersonation (cookie set by /api/imp)
  const cookieStore = await cookies();
  const impSession = cookieStore.get("__bookido_imp")?.value;
  const isImpersonating = impSession === tenantSlug;

  let userEmail: string | undefined;
  if (!isImpersonating) {
    const supabase = await createSsrClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    userEmail = user.email;
  }
  const banner = await getSubscriptionBanner(tenantSlug);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink-950 lg:flex-row">
      <Sidebar userEmail={userEmail ?? "superadmin"} />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Ambient background orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl animate-[pulse_11s_ease-in-out_infinite_2s]" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-cyan-500/4 blur-3xl animate-[pulse_14s_ease-in-out_infinite_4s]" />
        </div>
        {banner && <SubscriptionBanner banner={banner} />}
        <PanelTopBar newsItems={newsItems} tenantSlug={tenantSlug} />
        <main className="flex-1 overflow-y-auto relative">{children}</main>
        <BookingLiveAlert tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}

function SubscriptionBanner({
  banner,
}: {
  banner: { type: "suspended" | "expired" | "expiring"; daysLeft: number };
}) {
  if (banner.type === "suspended") {
    return (
      <div className="flex items-center gap-3 bg-amber-500/10 border-b border-amber-400/20 px-5 py-2.5 text-sm">
        <span className="text-amber-400">⚠</span>
        <p className="text-amber-300">
          Tu suscripción está{" "}
          <span className="font-semibold">suspendida</span>. Los clientes no
          pueden hacer reservas.{" "}
          <a
            href="https://wa.me/18096106459"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-200"
          >
            Contacta a Bookido para reactivar.
          </a>
        </p>
      </div>
    );
  }

  if (banner.type === "expired") {
    return (
      <div className="flex items-center gap-3 bg-red-500/10 border-b border-red-400/20 px-5 py-2.5 text-sm">
        <span className="text-red-400">⊘</span>
        <p className="text-red-300">
          Tu suscripción ha{" "}
          <span className="font-semibold">vencido</span>. Los clientes no
          pueden hacer reservas.{" "}
          <a
            href="https://wa.me/18096106459"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-red-200"
          >
            Renueva tu plan por WhatsApp.
          </a>
        </p>
      </div>
    );
  }

  // expiring soon
  const isUrgent = banner.daysLeft <= 5;
  return (
    <div
      className={`flex items-center gap-3 border-b px-5 py-2.5 text-sm ${
        isUrgent
          ? "bg-red-500/10 border-red-400/20"
          : "bg-amber-500/10 border-amber-400/20"
      }`}
    >
      <span className={isUrgent ? "text-red-400" : "text-amber-400"}>⏰</span>
      <p className={isUrgent ? "text-red-300" : "text-amber-300"}>
        Tu suscripción vence en{" "}
        <span className="font-semibold">
          {banner.daysLeft} día{banner.daysLeft !== 1 ? "s" : ""}
        </span>
        .{" "}
        <a
          href="https://wa.me/18096106459"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80"
        >
          Renueva antes de que venza.
        </a>
      </p>
    </div>
  );
}
