import { notFound } from "next/navigation";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { LandingEditor } from "@/components/admin/LandingEditor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LandingEditorPage({ params }: Props) {
  const { slug } = await params;
  const admin = createServiceSupabaseClient();
  if (!admin) notFound();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (tenantError) console.error("[landing/page] tenant error:", tenantError);
  if (!tenant) notFound();

  // Query landing separately — table may not exist yet (pre-migration)
  let landing = null;
  try {
    const { data, error } = await admin
      .from("bookido_landings")
      .select("*")
      .eq("tenant_slug", slug)
      .maybeSingle();
    if (error) console.error("[landing/page] landings error:", error);
    else landing = data;
  } catch (e) {
    console.error("[landing/page] landings exception:", e);
  }

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "bookido.online";

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-center gap-3">
        <a
          href="/admin/clientes"
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          ← Clientes
        </a>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-400">{(tenant as { name: string }).name}</span>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-white">Landing</span>
      </div>

      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-future text-2xl font-semibold text-white">
            Landing page
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Página pública en{" "}
            <a
              href={`https://${slug}.${baseDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              {slug}.{baseDomain}
            </a>
          </p>
        </div>
      </div>

      <LandingEditor slug={slug} landing={landing} baseDomain={baseDomain} />
    </div>
  );
}
