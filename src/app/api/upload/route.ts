import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

const BUCKET = "bookido-media";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const tenantSlug =
    request.headers.get("x-tenant-slug") ??
    process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG ??
    "";
  if (!tenantSlug) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Accept impersonation cookie OR real Supabase session
  const cookieStore = await cookies();
  const imp = cookieStore.get("__bookido_imp")?.value;
  if (!imp || imp !== tenantSlug) {
    // Fall back to Supabase session auth
    const { createSsrClient } = await import("@/lib/supabase/ssr");
    const supabase = await createSsrClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ── Parse form ────────────────────────────────────────────────────────────
  const admin = createServiceSupabaseClient();
  if (!admin) return NextResponse.json({ error: "Storage no configurado" }, { status: 500 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const type = (form.get("type") as string) ?? "gallery";
  const slot = (form.get("slot") as string) ?? "1";

  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Solo imágenes permitidas" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "Máximo 10 MB" }, { status: 400 });

  // ── Upload ────────────────────────────────────────────────────────────────
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${tenantSlug}/${type}/${slot}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);

  // Add cache-buster so the new image shows immediately after re-upload
  const url = `${publicUrl}?t=${Date.now()}`;
  return NextResponse.json({ url });
}
