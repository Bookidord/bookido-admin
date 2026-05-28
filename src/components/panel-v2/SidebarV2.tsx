"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "Operaci\u00f3n",
    items: [
      { name: "Inicio", href: "/panel", icon: "\ud83c\udfe0" },
      { name: "Landing", href: "/panel/landing", icon: "\ud83c\udf10" },
      { name: "Reservas", href: "/panel/reservas", icon: "\ud83d\udcc5" },
      { name: "Calendario", href: "/panel/calendario", icon: "\ud83d\udcc6" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { name: "Productos", href: "/panel/productos", icon: "\ud83d\udce6" },
      { name: "Servicios", href: "/panel/servicios", icon: "\u2728" },
    ],
  },
  {
    label: "Crecer",
    items: [
      { name: "Campa\u00f1as", href: "/panel/campanas", icon: "\ud83d\ude80" },
      { name: "Clientes", href: "/panel/clientes", icon: "\ud83d\udc65" },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { name: "Configuraci\u00f3n", href: "/panel/configuracion", icon: "\u2699\ufe0f" },
      { name: "Gu\u00edas", href: "/ayuda", icon: "\ud83d\udcd6" },
    ],
  },
];

function getRouteKey(href: string): string {
  if (href === "/panel") return "inicio";
  if (href === "/ayuda") return "guias";
  return href.replace("/panel/", "");
}

export function SidebarV2({
  tenantSlug,
  tenantName,
  whatsapp,
  activeRoute,
}: {
  tenantSlug: string;
  tenantName?: string;
  whatsapp?: string;
  activeRoute?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [waStatus, setWaStatus] = useState<"connected"|"disconnected"|"checking">("checking");
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  function handleLogout() {
    setSigningOut(true);
    // Clear all cookies first
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      }
    });
    // Fire signOut in background, don't wait
    supabase.auth.signOut().catch(() => {});
    // Redirect immediately
    window.location.replace("/login");
  }
  const pathname = usePathname();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/wa-status/${tenantSlug}`);
        const data = await res.json();
        setWaStatus(data.connected ? "connected" : "disconnected");
      } catch {
        setWaStatus("disconnected");
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [tenantSlug]);

  const displayName = tenantName || tenantSlug;
  const subdomain = `${tenantSlug}.bookido.online`;
  const initial = displayName.charAt(0).toUpperCase();

  const isActive = (href: string) => {
    if (activeRoute) return getRouteKey(href) === activeRoute;
    if (href === "/panel") return pathname === "/panel";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col bg-[var(--ink-900)] border-r border-white/[0.06] transition-all z-40"
      style={{
        width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
        transition: "width var(--sidebar-transition)",
      }}
    >
      {/* Tenant card header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.04] shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "rgb(var(--accent) / 0.15)", color: "var(--accent-hex)" }}
        >
          {initial}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-white/30 truncate">
              {subdomain}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 p-1 rounded text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all duration-[180ms]"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`
                    group relative flex items-center gap-3 py-2.5 rounded-lg mb-0.5
                    transition-all duration-[180ms]
                    ${active
                      ? "text-white border-l-[3px] pl-[9px] pr-3"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.03] px-3 border-l-[3px] border-transparent"
                    }
                  `}
                  style={{
                    transitionTimingFunction: "var(--ease-snap)",
                    ...(active
                      ? {
                          borderLeftColor: "var(--accent-hex)",
                          background: "rgb(var(--accent) / 0.08)",
                          boxShadow: "inset 0 0 12px rgb(var(--accent) / 0.06), 0 0 8px rgb(var(--accent) / 0.04)",
                        }
                      : {}),
                  }}
                  title={collapsed ? item.name : undefined}
                >
                  <span
                    className="text-lg shrink-0 transition-colors duration-[180ms]"
                    style={active ? { filter: "drop-shadow(0 0 4px rgb(var(--accent) / 0.3))" } : {}}
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="text-[13px] font-medium truncate">
                      {item.name}
                    </span>
                  )}

                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-3 border-t border-white/[0.04] shrink-0">
        {/* SOPORTE INSTANTÁNEO group */}
        {whatsapp && (
          <div className="mb-2">
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
                Soporte instantáneo
              </p>
            )}
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-[180ms] text-white/70 hover:text-white"
              style={{ background: "rgb(var(--accent) / 0.08)" }}
            >
              <span className="text-lg shrink-0 relative">
                {"\ud83d\udcac"}
                <span className="wa-dot absolute -top-0.5 -right-0.5" />
              </span>
              {!collapsed && (
                <span className="text-[13px] font-medium">WhatsApp</span>
              )}
            </a>
            {!collapsed && (
              <div className="px-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    waStatus === "connected" ? "bg-emerald-400" :
                    waStatus === "checking" ? "bg-amber-400 animate-pulse" :
                    "bg-red-400"
                  }`} />
                  <span className={`text-[9px] ${
                    waStatus === "connected" ? "text-emerald-400/60" :
                    waStatus === "checking" ? "text-amber-400/60" :
                    "text-red-400/60"
                  }`}>
                    {waStatus === "connected" ? "WhatsApp activo" :
                     waStatus === "checking" ? "Verificando..." :
                     "WhatsApp desconectado"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all duration-[180ms] disabled:opacity-40"
        >
          <span className="text-lg shrink-0">{"\ud83d\udeaa"}</span>
          {!collapsed && (
            <span className="text-[13px] font-medium">{signingOut ? "Saliendo..." : "Cerrar sesi\u00f3n"}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
