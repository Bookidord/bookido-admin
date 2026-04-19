"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSsrClient } from "@/lib/supabase/ssr";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { addMinutes } from "date-fns";
import { createCalendarEvent } from "@/lib/google-calendar";

async function requireAuth() {
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

export async function getBusyForDateAction(
  dateISO: string,
): Promise<{ ok: true; intervals: { starts_at: string; ends_at: string }[] } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: true, intervals: [] };

    const tenant = await getTenantSlug();
    const dayStart = new Date(dateISO);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateISO);
    dayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await admin
      .from("bookido_bookings")
      .select("starts_at, ends_at")
      .eq("tenant_slug", tenant)
      .in("status", ["confirmed", "pending"])
      .gte("starts_at", dayStart.toISOString())
      .lte("starts_at", dayEnd.toISOString());

    if (error) return { ok: false, error: error.message };
    return { ok: true, intervals: data ?? [] };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function createManualBookingAction(payload: {
  serviceId: string;
  startsAtISO: string;
  customerName: string;
  customerPhone: string;
  notes: string;
}): Promise<void> {
  await requireAuth();

  const admin = createServiceSupabaseClient();
  if (!admin) throw new Error("Admin client no disponible");

  const tenant = await getTenantSlug();

  // Fetch service to get duration
  const { data: svc, error: svcErr } = await admin
    .from("bookido_services")
    .select("name, duration_minutes")
    .eq("id", payload.serviceId)
    .eq("tenant_slug", tenant)
    .single();

  if (svcErr || !svc) throw new Error("Servicio no encontrado");

  const startsAt = new Date(payload.startsAtISO);
  const endsAt = addMinutes(startsAt, svc.duration_minutes);

  const { data: newBooking, error } = await admin
    .from("bookido_bookings")
    .insert({
      tenant_slug: tenant,
      service_id: payload.serviceId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      customer_name: payload.customerName,
      customer_email: "manual@bookido.panel",
      customer_phone: payload.customerPhone || null,
      notes: payload.notes || null,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Google Calendar sync (non-blocking)
  if (newBooking?.id) {
    const bookingId = newBooking.id;
    createCalendarEvent(tenant, {
      summary: `${svc.name ?? "Cita"} — ${payload.customerName}`,
      description: [
        payload.customerPhone ? `Tel: ${payload.customerPhone}` : null,
        payload.notes ? `Notas: ${payload.notes}` : null,
        "Reservado vía Bookido",
      ]
        .filter(Boolean)
        .join("\n"),
      startISO: startsAt.toISOString(),
      endISO: endsAt.toISOString(),
    })
      .then((googleEventId) => {
        if (googleEventId) {
          return admin
            .from("bookido_bookings")
            .update({ google_event_id: googleEventId })
            .eq("id", bookingId);
        }
      })
      .catch(console.error);
  }

  revalidatePath("/panel");
  revalidatePath("/panel/reservas");
  redirect("/panel/reservas");
}
