import "@/styles/tokens.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSsrClient } from "@/lib/supabase/ssr";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { getSettings } from "@/lib/settings";
import { SidebarV2 } from "@/components/panel-v2/SidebarV2";
import { BookingLiveAlert } from "@/components/panel/BookingLiveAlert";

async function getTenantData(slug: string) {
  const admin = createServiceSupabaseClient();
  if (!admin) return null;
  const { data } = await admin
    .from("tenants")
    .select("slug, name, settings")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function getSubscriptionBanner(tenantSlug: string) {
  const admin = createServiceSupabaseClient();
  if (!admin) return null;

  const { data: sub } = await admin
    .from("bookido_subscriptions")
    .select("status, end_date, is_courtesy")
    .eq("tenant_slug", tenantSlug)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return null;
  if (sub.is_courtesy) return null;

  const today = new Date();
  const endDate = new Date(sub.end_date);
  const daysLeft = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (sub.status === "suspended") return { type: "suspended" as const, daysLeft };
  if (daysLeft < 0) return { type: "expired" as const, daysLeft };
  if (daysLeft <= 15) return { type: "expiring" as const, daysLeft };
  return null;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantSlug = await getTenantSlug();
  const settings = await getSettings();

  // Allow superadmin impersonation
  const cookieStore = await cookies();
  const impSession = cookieStore.get("__bookido_imp")?.value;
  const isImpersonating = impSession === tenantSlug;

  if (!isImpersonating) {
    const supabase = await createSsrClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  // Tenant data for V2 theming
  const tenantData = await getTenantData(tenantSlug);
  const tenantName = tenantData?.name || tenantSlug;
  const whatsapp = tenantData?.settings?.whatsapp || settings.whatsapp || "";
  const accentHex = tenantData?.settings?.accent || "#00F8A0";

  const banner = await getSubscriptionBanner(tenantSlug);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <style>{`body { --accent: ${hexToRgb(accentHex)}; --accent-hex: ${accentHex}; margin: 0; }`}</style>
      <div className="flex h-dvh overflow-hidden bg-[var(--ink-950)]">
        <SidebarV2
          tenantSlug={tenantSlug}
          tenantName={tenantName}
          whatsapp={whatsapp}
        />
        <div
          className="flex flex-1 flex-col overflow-hidden relative"
          style={{ marginLeft: "var(--sidebar-w)" }}
        >
          {banner && <SubscriptionBanner banner={banner} />}
          <main className="flex-1 overflow-y-auto relative">{children}</main>
          <BookingLiveAlert tenantSlug={tenantSlug} />
        </div>
      </div>
    </>
  );
}

function SubscriptionBanner({
  banner,
}: {
  banner: { type: "suspended" | "expired" | "expiring"; daysLeft: number };
}) {
  const waHref = `https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "447586255903"}`;

  if (banner.type === "suspended") {
    return (
      <div className="flex items-center gap-3 bg-amber-500/10 border-b border-amber-400/20 px-5 py-2.5 text-sm shrink-0">
        <span className="text-amber-400">\u26a0</span>
        <p className="text-amber-300">
          Tu suscripci\u00f3n est\u00e1 <span className="font-semibold">suspendida</span>.{" "}
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200">
            Contacta a Bookido para reactivar.
          </a>
        </p>
      </div>
    );
  }

  if (banner.type === "expired") {
    return (
      <div className="flex items-center gap-3 bg-red-500/10 border-b border-red-400/20 px-5 py-2.5 text-sm shrink-0">
        <span className="text-red-400">\u2298</span>
        <p className="text-red-300">
          Tu suscripci\u00f3n ha <span className="font-semibold">vencido</span>.{" "}
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">
            Renueva tu plan por WhatsApp.
          </a>
        </p>
      </div>
    );
  }

  const isUrgent = banner.daysLeft <= 5;
  return (
    <div className={`flex items-center gap-3 border-b px-5 py-2.5 text-sm shrink-0 ${isUrgent ? "bg-red-500/10 border-red-400/20" : "bg-amber-500/10 border-amber-400/20"}`}>
      <span className={isUrgent ? "text-red-400" : "text-amber-400"}>\u23f0</span>
      <p className={isUrgent ? "text-red-300" : "text-amber-300"}>
        Tu suscripci\u00f3n vence en <span className="font-semibold">{banner.daysLeft} d\u00eda{banner.daysLeft !== 1 ? "s" : ""}</span>.{" "}
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
          Renueva antes de que venza.
        </a>
      </p>
    </div>
  );
}
