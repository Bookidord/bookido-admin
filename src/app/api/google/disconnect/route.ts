import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createSsrClient } from "@/lib/supabase/ssr";
import { createOAuth2Client } from "@/lib/google-calendar";
import { decryptToken } from "@/lib/token-crypto";

/** POST /api/google/disconnect
 *  Revokes Google token and removes the connection row.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantSlug =
    request.headers.get("x-tenant-slug") ??
    process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG ??
    "unknown";

  const admin = createServiceSupabaseClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 500 });
  }

  // Fetch current tokens to revoke them
  const { data: conn } = await admin
    .from("google_calendar_connections")
    .select("access_token_enc, refresh_token_enc")
    .eq("tenant_slug", tenantSlug)
    .maybeSingle();

  if (conn) {
    try {
      const oauth2 = createOAuth2Client();
      const refreshToken = decryptToken(conn.refresh_token_enc);
      await oauth2.revokeToken(refreshToken);
    } catch {
      // If revocation fails, still delete locally
    }
  }

  // Remove from DB
  await admin
    .from("google_calendar_connections")
    .delete()
    .eq("tenant_slug", tenantSlug);

  // Clean up external blocked slots
  await admin
    .from("external_blocked_slots")
    .delete()
    .eq("tenant_slug", tenantSlug);

  return NextResponse.json({ ok: true });
}
