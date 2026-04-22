import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

const RESERVED_SLUGS = new Set([
  "www", "api", "admin", "app", "mail", "panel", "blog", "help",
  "support", "static", "assets", "cdn", "bookido", "registro",
]);

function validateSlug(slug: string): string | null {
  if (!slug) return "El subdominio es requerido.";
  if (slug.length < 2) return "El subdominio debe tener al menos 2 caracteres.";
  if (slug.length > 50) return "El subdominio es demasiado largo (máx. 50 caracteres).";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length > 1)
    return "Solo letras minúsculas, números y guiones. No puede empezar ni terminar con guión.";
  if (RESERVED_SLUGS.has(slug)) return "Ese subdominio está reservado. Elige otro.";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, business_name, owner_email } = body ?? {};

    // ── Validate inputs ──────────────────────────────────────────────────────
    const slugError = validateSlug(slug?.trim() ?? "");
    if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });

    if (!business_name?.trim())
      return NextResponse.json({ error: "El nombre del negocio es requerido." }, { status: 400 });

    if (!owner_email?.includes("@"))
      return NextResponse.json({ error: "Correo electrónico inválido." }, { status: 400 });

    // Default PIN 1111 — owner changes it on first login
    const owner_password = "1111!Bk#";

    const admin = createServiceSupabaseClient();
    if (!admin)
      return NextResponse.json({ error: "Servidor no configurado." }, { status: 500 });

    const cleanSlug = slug.trim().toLowerCase();

    // ── Check slug uniqueness ────────────────────────────────────────────────
    const { data: existing } = await admin
      .from("tenants")
      .select("slug")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (existing)
      return NextResponse.json(
        { error: "Ese subdominio ya está en uso. Elige otro." },
        { status: 409 },
      );

    // ── Create Supabase Auth user ────────────────────────────────────────────
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: owner_email.trim().toLowerCase(),
      password: owner_password,
      email_confirm: true, // skip email confirmation for now
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Error al crear el usuario." },
        { status: 400 },
      );
    }

    // ── Create tenant row ────────────────────────────────────────────────────
    const { error: tenantError } = await admin.from("tenants").insert({
      slug: cleanSlug,
      name: business_name.trim(),
      owner_email: owner_email.trim().toLowerCase(),
    });

    if (tenantError) {
      // Roll back: delete the auth user to avoid orphaned accounts
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    const subdomain = `https://${cleanSlug}.bookido.online`;
    return NextResponse.json({ ok: true, subdomain, slug: cleanSlug }, { status: 201 });
  } catch (e) {
    console.error("[/api/tenants/create]", e);
    return NextResponse.json({ error: "Error inesperado. Intenta de nuevo." }, { status: 500 });
  }
}
