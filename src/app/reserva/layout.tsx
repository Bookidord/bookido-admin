import type { Metadata } from "next";
import { headers } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const h = await headers();
    const slug = h.get("x-tenant-slug");
    if (slug) {
      const admin = createServiceSupabaseClient();
      if (admin) {
        const { data } = await admin.from("tenants").select("name").eq("slug", slug).maybeSingle();
        if (data?.name) {
          return {
            title: `Reservar cita \u00b7 ${data.name}`,
            description: `Elige d\u00eda y hora para tu cita en ${data.name}.`,
          };
        }
      }
    }
  } catch {}
  return {
    title: "Reservar cita \u00b7 Bookido",
    description: "Elige d\u00eda y hora para tu cita.",
  };
}

export default function ReservaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
