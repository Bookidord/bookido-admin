import { headers } from "next/headers";

/**
 * Resolves the current tenant slug in a request context.
 *
 * Priority:
 *  1. x-tenant-slug header injected by middleware (subdomain-based)
 *  2. NEXT_PUBLIC_BOOKIDO_TENANT_SLUG env var (localhost dev)
 *  3. Hardcoded fallback "bookido-demo"
 */
export async function getTenantSlug(): Promise<string> {
  try {
    const h = await headers();
    const slug = h.get("x-tenant-slug");
    if (slug) return slug;
  } catch {
    // Not in a request context (build time, static generation)
  }
  return process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG ?? "bookido-demo";
}
