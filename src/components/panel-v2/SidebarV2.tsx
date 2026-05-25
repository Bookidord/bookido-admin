"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "Operación",
    items: [
      { name: "Inicio", href: "/panel", icon: "🏠" },
      { name: "Landing", href: "/panel/landing", icon: "🌐" },
      { name: "Reservas", href: "/panel/reservas", icon: "📅", badge: true },
      { name: "Calendario", href: "/panel/calendario", icon: "📆" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { name: "Productos", href: "/panel/productos", icon: "📦" },
      { name: "Servicios", href: "/panel/servicios", icon: "✨" },
    ],
  },
  {
    label: "Crecer",
    items: [
      { name: "Campañas", href: "/panel/campanas", icon: "🚀" },
      { name: "Clientes", href: "/panel/clientes", icon: "👥" },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { name: "Configuración", href: "/panel/configuracion", icon: "⚙️" },
      { name: "Guías", href: "/ayuda", icon: "📖" },
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
  const pathname = usePathname();

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

                  {item.badge && !collapsed && (
                    <span
                      className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "rgb(var(--accent) / 0.15)",
                        color: "var(--accent-hex)",
                      }}
                    >
                      3
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
                💬
                <span className="wa-dot absolute -top-0.5 -right-0.5" />
              </span>
              {!collapsed && (
                <span className="text-[13px] font-medium">WhatsApp</span>
              )}
            </a>
          </div>
        )}

        {/* Logout */}
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all duration-[180ms]"
        >
          <span className="text-lg shrink-0">🚪</span>
          {!collapsed && (
            <span className="text-[13px] font-medium">Cerrar sesión</span>
          )}
        </Link>
      </div>
    </aside>
  );
}
