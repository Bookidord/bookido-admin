"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/admin-session";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) throw new Error("No autorizado");
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export async function crearClienteAction(input: {
  business_name: string;
  slug: string;
  email: string;
  password: string;
  plan_id: string;
  start_date: string;
  notes: string;
}): Promise<{ ok: true; subdomain: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const slug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug))
      return { ok: false, error: "Slug inválido." };

    // Check slug uniqueness
    const { data: existing } = await admin
      .from("tenants")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) return { ok: false, error: "Ese subdominio ya existe." };

    // Get plan duration
    const { data: plan } = await admin
      .from("bookido_plans")
      .select("duration_days")
      .eq("id", input.plan_id)
      .single();
    if (!plan) return { ok: false, error: "Plan no encontrado." };

    // Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      email_confirm: true,
    });
    if (authErr || !authData.user)
      return { ok: false, error: authErr?.message ?? "Error al crear usuario." };

    // Create tenant
    const { error: tenantErr } = await admin.from("tenants").insert({
      slug,
      business_name: input.business_name.trim(),
      email: input.email.trim().toLowerCase(),
      plan: "basic",
      is_active: true,
      whatsapp: "",
      open_hour: 9,
      close_hour: 19,
      description: "",
      primary_color: "#be185d",
    });
    if (tenantErr) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { ok: false, error: tenantErr.message };
    }

    // Create subscription
    const startDate = input.start_date || new Date().toISOString().split("T")[0];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    const { error: subErr } = await admin.from("bookido_subscriptions").insert({
      tenant_slug: slug,
      plan_id: input.plan_id,
      start_date: startDate,
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
      notes: input.notes || null,
    });
    if (subErr) return { ok: false, error: subErr.message };

    revalidatePath("/admin");
    revalidatePath("/admin/clientes");
    return { ok: true, subdomain: `https://${slug}.bookido.online` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function renovarAction(input: {
  subscription_id: string;
  plan_id: string;
  from: "today" | "expiry";
  current_end_date: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const { data: plan } = await admin
      .from("bookido_plans")
      .select("duration_days")
      .eq("id", input.plan_id)
      .single();
    if (!plan) return { ok: false, error: "Plan no encontrado." };

    const baseDate =
      input.from === "today"
        ? new Date().toISOString().split("T")[0]
        : input.current_end_date;
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    const { error } = await admin
      .from("bookido_subscriptions")
      .update({
        plan_id: input.plan_id,
        end_date: endDate.toISOString().split("T")[0],
        status: "active",
      })
      .eq("id", input.subscription_id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin");
    revalidatePath("/admin/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function impersonarAction(
  slug: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const { data: tenant } = await admin
      .from("tenants")
      .select("owner_email")
      .eq("slug", slug)
      .maybeSingle();
    if (!tenant) return { ok: false, error: "Tenant no encontrado." };

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: tenant.owner_email,
      options: { redirectTo: `https://${slug}.bookido.online/panel` },
    });
    if (error || !data?.properties?.action_link)
      return { ok: false, error: error?.message ?? "No se pudo generar el enlace." };

    return { ok: true, url: data.properties.action_link };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function suspenderAction(
  subscription_id: string,
  suspend: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const { error } = await admin
      .from("bookido_subscriptions")
      .update({ status: suspend ? "suspended" : "active" })
      .eq("id", subscription_id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin");
    revalidatePath("/admin/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
