"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("admin-sidebar-collapsed", String(next));
  }

  // Avoid layout shift: render expanded until hydrated
  const effectiveCollapsed = mounted ? collapsed : false;

  return (
    <div className="flex h-dvh overflow-hidden bg-ink-950 lg:flex-row flex-col">
      <AdminSidebar collapsed={effectiveCollapsed} onToggle={toggle} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
