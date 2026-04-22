import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("t") ?? "";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  const dot = token.lastIndexOf(".");
  if (dot !== -1) {
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const [slug, expStr] = payload.split(":");
    const exp = parseInt(expStr ?? "0", 10);
    const now = Math.floor(Date.now() / 1000);
    const secret = process.env.ADMIN_SESSION_SECRET ?? "dev";
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    console.log("[imp-route] payload=", payload, "exp>now=", exp > now, "sigMatch=", expected === sig, "exp=", expected.slice(0,10), "got=", sig.slice(0,10));

    if (slug && exp > now) {
      if (expected === sig) {
        const panelUrl = `${proto}://${host}/panel`;
        const res = NextResponse.redirect(panelUrl);
        res.cookies.set("__bookido_imp", slug, {
          httpOnly: true,
          maxAge: 3600,
          path: "/",
          sameSite: "lax",
        });
        return res;
      }
    }
  }

  const loginUrl = `${proto}://${host}/login`;
  return NextResponse.redirect(loginUrl);
}
