import { NextRequest, NextResponse } from "next/server";
import { syncExternalEventsForTenant } from "@/lib/google-calendar";

/** POST /api/google/webhook
 *  Receives Google Calendar push notifications.
 *  Responds immediately with 200 then processes asynchronously.
 *
 *  Google sends these headers:
 *    X-Goog-Channel-Token  → tenant_slug (set in setupPushNotifications)
 *    X-Goog-Resource-State → "sync" (initial), "exists" (event changed), "not_exists" (deleted)
 */
export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-goog-channel-token");
  const resourceState = request.headers.get("x-goog-resource-state");

  // Respond 200 immediately — Google requires a fast ack
  if (!tenantSlug || resourceState === "sync") {
    return new NextResponse(null, { status: 200 });
  }

  // Process in the background (non-blocking response to Google)
  syncExternalEventsForTenant(tenantSlug).catch((err) =>
    console.error("[gcal webhook] sync error:", err)
  );

  return new NextResponse(null, { status: 200 });
}
