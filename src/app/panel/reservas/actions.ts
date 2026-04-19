"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createSsrClient } from "@/lib/supabase/ssr";
import { getTenantSlug } from "@/lib/tenant";
import { deleteCalendarEvent, createCalendarEvent } from "@/lib/google-calendar";

async function requireAuth() {
  const supabase = await createSsrClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

export async function cancelBookingAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const tenant = await getTenantSlug();

    // Fetch google_event_id before cancelling
    const { data: booking } = await admin
      .from("bookido_bookings")
      .select("google_event_id")
      .eq("id", id)
      .eq("tenant_slug", tenant)
      .maybeSingle();

    const { error } = await admin
      .from("bookido_bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("tenant_slug", tenant);

    if (error) return { ok: false, error: error.message };

    // Delete Google Calendar event (non-blocking)
    if (booking?.google_event_id) {
      deleteCalendarEvent(tenant, booking.google_event_id).catch(console.error);
    }

    revalidatePath("/panel");
    revalidatePath("/panel/reservas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function restoreBookingAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const tenant = await getTenantSlug();

    // Fetch booking details to re-create the Google event
    const { data: booking } = await admin
      .from("bookido_bookings")
      .select("customer_name, customer_phone, notes, starts_at, ends_at, service_id")
      .eq("id", id)
      .eq("tenant_slug", tenant)
      .maybeSingle();

    const { error } = await admin
      .from("bookido_bookings")
      .update({ status: "confirmed" })
      .eq("id", id)
      .eq("tenant_slug", tenant);

    if (error) return { ok: false, error: error.message };

    // Re-create Google Calendar event (non-blocking)
    if (booking) {
      let serviceName = "Cita";
      try {
        const { data: svc } = await admin
          .from("bookido_services")
          .select("name")
          .eq("id", booking.service_id)
          .maybeSingle();
        if (svc?.name) serviceName = svc.name;
      } catch { /* ignore */ }

      createCalendarEvent(tenant, {
        summary: `${serviceName} — ${booking.customer_name}`,
        description: [
          booking.customer_phone ? `Tel: ${booking.customer_phone}` : null,
          booking.notes ? `Notas: ${booking.notes}` : null,
          "Reservado vía Bookido",
        ].filter(Boolean).join("\n"),
        startISO: booking.starts_at,
        endISO: booking.ends_at,
      })
        .then((googleEventId) => {
          if (googleEventId) {
            return admin
              .from("bookido_bookings")
              .update({ google_event_id: googleEventId })
              .eq("id", id);
          }
        })
        .catch(console.error);
    }

    revalidatePath("/panel");
    revalidatePath("/panel/reservas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
