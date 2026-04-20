import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookido · Admin",
  description: "Panel de administración de Bookido.",
};

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/admin-session";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) redirect("/admin/login");

  return <AdminShell>{children}</AdminShell>;
}
