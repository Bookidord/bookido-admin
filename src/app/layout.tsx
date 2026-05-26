import type { Metadata } from "next";
import { headers } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { Cormorant_Garamond, Geist, Geist_Mono, Syne } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const h = await headers();
    const slug = h.get("x-tenant-slug");
    if (slug) {
      const admin = createServiceSupabaseClient();
      if (admin) {
        const { data } = await admin.from("tenants").select("name, logo_url").eq("slug", slug).maybeSingle();
        if (data?.name) {
          return {
            title: data.name,
            description: `Reserva tu cita en ${data.name}. Gestión de reservas online.`,
            icons: data.logo_url ? [{ url: data.logo_url, type: "image/png" }] : undefined,
          };
        }
      }
    }
  } catch {}
  return {
    title: "Bookido",
    description: "Gestión de reservas online para negocios de belleza y servicios.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${syne.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
