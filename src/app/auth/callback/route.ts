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
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/panel";

  if (code) {
    const supabase = await createSsrClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed — send to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
