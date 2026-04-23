"use server";

import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { requirePanelAuth } from "@/lib/panel-auth";
import { sendCampaignEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";

type Client = {
  name: string;
  email: string;
  phone: string | null;
  total: number;
};

function clientTier(total: number): "vip" | "regular" | "new" {
  if (total >= 10) return "vip";
  if (total >= 4) return "regular";
  return "new";
}

export async function sendCampaignAction(payload: {
  subject: string;
  message: string;
  channel: "email" | "whatsapp";
  filter: "all" | "vip" | "regular" | "new";
}): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const tenant = await getTenantSlug();
    const settings = await getSettings();
    const bookingUrl = `https://${tenant}.bookido.online/reserva`;

    // Fetch all bookings to build client list
    const { data: bookingsRaw } = await admin
      .from("bookido_bookings")
      .select("customer_name, customer_email, customer_phone")
      .eq("tenant_slug", tenant)
      .order("starts_at", { ascending: false });

    // Aggregate unique clients by email
    const map: Record<string, Client> = {};
    for (const b of bookingsRaw ?? []) {
      const key = b.customer_email.toLowerCase();
      if (!map[key]) {
        map[key] = { name: b.customer_name, email: b.customer_email, phone: b.customer_phone, total: 0 };
      }
      map[key].total++;
    }

    // Apply filter
    const clients = Object.values(map).filter((c) => {
      if (payload.filter === "all") return true;
      return clientTier(c.total) === payload.filter;
    });

    if (clients.length === 0) return { ok: false, error: "No hay clientes que coincidan con el filtro." };
    if (payload.channel !== "email") return { ok: true, sent: clients.length }; // WA handled client-side

    const businessName = settings.business_name ?? tenant;
    let sent = 0;
    const errors: string[] = [];

    for (const c of clients) {
      const firstName = c.name.split(" ")[0];
      const personalizedMsg = payload.message.replace(/\{\{nombre\}\}/g, firstName);
      try {
        await sendCampaignEmail({
          to: c.email,
          firstName,
          businessName,
          subject: payload.subject,
          message: personalizedMsg,
          bookingUrl,
        });
        sent++;
      } catch (e) {
        errors.push(`${c.email}: ${(e as Error).message}`);
      }
      // Small delay to avoid Resend rate limits
      await new Promise((r) => setTimeout(r, 120));
    }

    if (sent === 0) return { ok: false, error: errors[0] ?? "Error enviando emails." };
    return { ok: true, sent };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
