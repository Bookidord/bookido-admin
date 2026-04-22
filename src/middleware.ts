import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSsrMiddlewareClient } from "@/lib/supabase/ssr";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "bookido.online";

/** Extract the tenant slug from the hostname, or null if no subdomain / admin subdomain. */
function resolveTenantSlug(hostname: string, pathname: string): string | null {
  const host = hostname.split(":")[0];

  // localhost / 127.x / ::1 — use env var for local dev
  // /admin paths on localhost are for the master admin panel — no tenant
  if (host === "localhost" || host.startsWith("127.") || host === "::1") {
    if (pathname.startsWith("/admin")) return null;
    return process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG ?? "bookido-demo";
  }

  // Apex domain or www — no tenant (marketing / registration)
  if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) return null;

  // subdomain.bookido.online — exclude reserved subdomains
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = host.slice(0, host.length - BASE_DOMAIN.length - 1);
    if (sub && sub !== "www" && sub !== "admin") return sub;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const host = hostname.split(":")[0];

  // www.bookido.online → redirect to bookido.online
  if (host === `www.${BASE_DOMAIN}`) {
    const url = request.nextUrl.clone();
    url.hostname = BASE_DOMAIN;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // Apex domain root → registration page
  if (host === BASE_DOMAIN && pathname === "/") {
    return NextResponse.redirect(new URL("/registro", request.url), 302);
  }

  // ── Admin requests ──────────────────────────────────────────────────────────
  // admin.bookido.online (production) OR /admin/* on localhost (dev)
  // Admin has its own cookie-based auth — skip tenant and Supabase session logic.
  const isAdminRequest =
    host === `admin.${BASE_DOMAIN}` ||
    ((host === "localhost" || host.startsWith("127.") || host === "::1") &&
      pathname.startsWith("/admin"));

  if (isAdminRequest) {
    return NextResponse.next();
  }

  // ── Tenant resolution ───────────────────────────────────────────────────────
  const tenantSlug = resolveTenantSlug(hostname, pathname);

  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // ── Subscription enforcement (booking pages only) ───────────────────────────
  // We only block /reserva — the panel still works so owners can log in.
  if (tenantSlug && pathname.startsWith("/reserva")) {
    const admin = createServiceSupabaseClient();
    if (admin) {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const { data: sub } = await admin
        .from("bookido_subscriptions")
        .select("status, end_date")
        .eq("tenant_slug", tenantSlug)
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub) {
        if (sub.status === "suspended") {
          return NextResponse.rewrite(new URL("/suspended", request.url));
        }
        if (sub.end_date < today) {
          return NextResponse.rewrite(new URL("/expired", request.url));
        }
      }
    }
  }

  // ── Supabase auth session refresh ───────────────────────────────────────────
  const supabase = createSsrMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes accessible without a tenant (registration, tenant API)
  const isPublicNoTenant =
    pathname.startsWith("/registro") || pathname.startsWith("/api/tenants");

  // If a tenant-required route is accessed from the apex domain, redirect away.
  if (
    !tenantSlug &&
    !isPublicNoTenant &&
    (pathname.startsWith("/panel") || pathname.startsWith("/reserva"))
  ) {
    return NextResponse.redirect(`https://${BASE_DOMAIN}`);
  }

  // Protect /panel/*
  if (pathname.startsWith("/panel") && !user) {
    // Allow superadmin impersonation via cookie set by /api/imp route
    const impSession = request.cookies.get("__bookido_imp")?.value;
    if (impSession && tenantSlug && impSession === tenantSlug) {
      return response;
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from /login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
