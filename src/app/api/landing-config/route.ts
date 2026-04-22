import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

const BUCKET = "bookido-media";

function tenantFromRequest(req: NextRequest) {
  return (
    req.headers.get("x-tenant-slug") ??
    process.env.NEXT_PUBLIC_BOOKIDO_TENANT_SLUG ??
    ""
  );
}

async function checkAuth(tenant: string): Promise<boolean> {
  const cookieStore = await cookies();
  const imp = cookieStore.get("__bookido_imp")?.value;
  if (imp && imp === tenant) return true;
  // Real Supabase session
  const { createSsrClient } = await import("@/lib/supabase/ssr");
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

// GET — read config (public, no auth needed)
export async function GET(request: NextRequest) {
  const tenant = tenantFromRequest(request);
  if (!tenant) return NextResponse.json({}, { status: 200 });

  const admin = createServiceSupabaseClient();
  if (!admin) return NextResponse.json({}, { status: 200 });

  const { data, error } = await admin.storage
    .from(BUCKET)
    .download(`config/${tenant}.json`);

  if (error || !data) return NextResponse.json({}, { status: 200 });

  const text = await data.text();
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}

// POST — save config
export async function POST(request: NextRequest) {
  const tenant = tenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const authed = await checkAuth(tenant);
  if (!authed) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createServiceSupabaseClient();
  if (!admin) return NextResponse.json({ error: "Storage no configurado" }, { status: 500 });

  const body = await request.json();
  const json = JSON.stringify(body);
  const blob = new Blob([json], { type: "application/json" });

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(`config/${tenant}.json`, blob, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
