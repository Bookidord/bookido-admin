import { NextRequest, NextResponse } from "next/server";
import { createSsrClient } from "@/lib/supabase/ssr";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

/** GET /api/google/auth
 *  Redirects the authenticated salon owner to Google's OAuth consent screen.
 */
export async function GET(request: NextRequest) {
  // Must be authenticated
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Tenant slug comes from the x-tenant-slug header set by middleware
  const tenantSlug =
    request.headers.get("x-tenant-slug") ??
    process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG ??
    "unknown";

  const url = getGoogleAuthUrl(tenantSlug);
  return NextResponse.redirect(url);
}
