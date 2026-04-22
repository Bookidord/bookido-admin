import { NextRequest, NextResponse } from "next/server";
import { createSsrClient } from "@/lib/supabase/ssr";

/**
 * Supabase PKCE callback — exchanges one-time `code` for a session cookie,
 * then redirects to `next` (default: /panel).
 *
 * Email links (reset-password, magic-link, confirm) use:
 *   redirectTo: <origin>/auth/callback?next=/reset-password
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/panel";

  // Use forwarded host from nginx, not internal localhost
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "admin.bookido.online";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  if (code) {
    const supabase = await createSsrClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = next.startsWith("http") ? next : `${origin}${next}`;
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
