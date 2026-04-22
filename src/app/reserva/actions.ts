"use server";

import { addMinutes } from "date-fns";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmation } from "@/lib/email";
import { sendWhatsApp } from "@/lib/whatsapp";

const SERVICES = "bookido_services";
const BOOKINGS = "bookido_bookings";

export async function getBusyIntervalsAction(
  tenantSlug: string,
  rangeStartISO: string,
  rangeEndISO: string,
): Promise<
  { ok: true; intervals: { starts_at: string; ends_at: string }[] } | { ok: false; error: string }
> {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return { ok: false, error: "Supabase no está configurado en el servidor." };
  }

  // Fetch Bookido bookings
  const { data: bookingRows, error } = await admin
    .from(BOOKINGS)
    .select("starts_at, ends_at")
    .eq("tenant_slug", tenantSlug)
    .neq("status", "cancelled")
    .lt("starts_at", rangeEndISO)
    .gt("ends_at", rangeStartISO);

  if (error) {
    return { ok: false, error: error.message };
  }

  // Also fetch external blocked slots from Google Calendar
  const { data: externalRows } = await admin
    .from("external_blocked_slots")
    .select("starts_at, ends_at")
    .eq("tenant_slug", tenantSlug)
    .lt("starts_at", rangeEndISO)
    .gt("ends_at", rangeStartISO);

  const intervals = [
    ...(bookingRows ?? []),
    ...(externalRows ?? []),
  ];

  return { ok: true, intervals };
}

export async function createBookingAction(input: {
  tenantSlug: string;
  serviceId: string;
  startsAtISO: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return { ok: false, error: "Supabase no está configurado en el servidor." };
  }

  const name = input.customerName.trim();
  const email = input.customerEmail.trim();
  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: "Indica un nombre válido." };
  }
  if (email.length < 5 || email.length > 254 || !email.includes("@")) {
    return { ok: false, error: "Indica un correo válido." };
  }

  const { data: svc, error: svcErr } = await admin
    .from(SERVICES)
    .select("id, name, duration_minutes, active, tenant_slug")
    .eq("id", input.serviceId)
    .eq("tenant_slug", input.tenantSlug)
    .single();

  if (svcErr || !svc || !svc.active) {
    return { ok: false, error: "Servicio no disponible." };
  }

  const startsAt = new Date(input.startsAtISO);
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: "Fecha u hora no válida." };
  }

  const endsAt = addMinutes(startsAt, svc.duration_minutes);

  const { data: conflicts, error: conflictErr } = await admin
    .from(BOOKINGS)
    .select("id")
    .eq("tenant_slug", input.tenantSlug)
    .neq("status", "cancelled")
    .lt("starts_at", endsAt.toISOString())
    .gt("ends_at", startsAt.toISOString());

  if (conflictErr) {
    return { ok: false, error: conflictErr.message };
  }
  if (conflicts?.length) {
    return {
      ok: false,
      error: "Ese horario acaba de ocuparse. Elige otra franja.",
    };
  }

  const { data: newBooking, error: insertErr } = await admin
    .from(BOOKINGS)
    .insert({
      tenant_slug: input.tenantSlug,
      service_id: input.serviceId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      customer_name: name,
      customer_email: email,
      customer_phone: input.customerPhone?.trim() || null,
      notes: input.notes?.trim() || null,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  // ── Email + WhatsApp (non-blocking) ──────────────────────────────────────
  if (newBooking?.id) {
    (async () => {
      try {
        const { data: tenant } = await admin
          .from("tenants")
          .select("name, settings")
          .eq("slug", input.tenantSlug)
          .maybeSingle();

        // Email to customer
        await sendBookingConfirmation({
          to: email,
          customerName: name,
          businessName: tenant?.name ?? input.tenantSlug,
          serviceName: svc.name,
          startsAt,
          notes: input.notes ?? null,
        });

        // WhatsApp to customer
        if (input.customerPhone) {
          const customerDateStr = startsAt.toLocaleString("es-DO", {
            timeZone: "America/Santo_Domingo",
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          await sendWhatsApp(
            input.customerPhone,
            `✅ *Cita confirmada en ${tenant?.name ?? input.tenantSlug}*\n\n` +
            `Hola ${name.split(" ")[0]}, tu reserva quedó lista:\n\n` +
            `✂️ ${svc.name}\n` +
            `🕐 ${customerDateStr}\n\n` +
            `Si necesitas cambiar o cancelar, contáctanos directamente.`,
          );
        }

        // WhatsApp to business owner
        const ownerPhone = (tenant?.settings as Record<string, string> | null)?.whatsapp;
        if (ownerPhone) {
          const dateStr = startsAt.toLocaleString("es-DO", {
            timeZone: "America/Santo_Domingo",
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          await sendWhatsApp(
            ownerPhone,
            `📅 *Nueva reserva en ${tenant?.name ?? input.tenantSlug}*\n\n` +
            `👤 ${name}\n` +
            `✂️ ${svc.name}\n` +
            `🕐 ${dateStr}\n` +
            (input.customerPhone ? `📱 ${input.customerPhone}\n` : "") +
            (input.notes ? `📝 ${input.notes}\n` : "") +
            `\nVer panel: https://${input.tenantSlug}.bookido.online/panel`,
          );
        }
      } catch (err) {
        console.error("[reserva] Post-booking notifications failed:", err);
      }
    })();
  }

  // ── Google Calendar sync (non-blocking) ───────────────────────────────────
  if (newBooking?.id) {
    const bookingId = newBooking.id;
    createCalendarEvent(input.tenantSlug, {
      summary: `${svc.name ?? "Cita"} — ${name}`,
      description: [
        input.customerPhone ? `Tel: ${input.customerPhone}` : null,
        input.notes ? `Notas: ${input.notes}` : null,
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
            .from(BOOKINGS)
            .update({ google_event_id: googleEventId })
            .eq("id", bookingId);
        }
      })
      .catch((err) => console.error("[reserva] Google sync failed:", err));
  }

  return { ok: true };
}
