import { headers, cookies } from "next/headers";

/**
 * Resolves the current tenant slug in a request context.
 *
 * Priority:
 *  1. x-tenant-slug header injected by middleware (subdomain-based)
 *  2. __bookido_imp cookie (admin impersonation on admin.bookido.online)
 *  3. NEXT_PUBLIC_BOOKIDO_TENANT_SLUG env var (localhost dev)
 *  4. Hardcoded fallback "bookido-demo"
 */
export async function getTenantSlug(): Promise<string> {
  try {
    const h = await headers();
    const slug = h.get("x-tenant-slug");
    if (slug) return slug;

    // Admin impersonation: __bookido_imp cookie holds the target tenant slug
    const cookieStore = await cookies();
    const imp = cookieStore.get("__bookido_imp")?.value;
    if (imp) return imp;
  } catch {
    // Not in a request context (build time, static generation)
  }
  return process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG ?? "bookido-demo";
}
