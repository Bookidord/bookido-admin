import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSsrClient } from "@/lib/supabase/ssr";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { Sidebar } from "@/components/panel/Sidebar";
import { PanelTopBar } from "@/components/panel/PanelTopBar";

async function fetchNewsItems(): Promise<string[]> {
  try {
    const res = await fetch("https://listindiario.com/rss", {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = [...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gm)];
    return matches
      .map((m) => m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim())
      .filter(Boolean)
      .slice(0, 10);
  } catch {
    return [];
  }
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
      <div className="flex flex-1 flex-col overflow-hidden">
        {banner && <SubscriptionBanner banner={banner} />}
        <PanelTopBar newsItems={newsItems} tenantSlug={tenantSlug} />
        <main className="flex-1 overflow-y-auto">{children}</main>
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
