import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Admin · Bookido" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />

      <div className="relative w-full max-w-[360px]">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <p className="text-xl font-semibold tracking-[-0.3px] text-zinc-100">Bookido</p>
          <p className="mt-1 text-xs text-zinc-600">Panel de administración</p>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  );
}
