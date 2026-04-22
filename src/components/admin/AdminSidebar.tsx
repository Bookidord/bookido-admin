"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogoutAction } from "@/app/admin/login/actions";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    exact: false,
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/planes",
    label: "Planes",
    exact: false,
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    exact: false,
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function isActive(item: { href: string; exact: boolean }) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  function handleLogout() {
    startTransition(async () => {
      await adminLogoutAction();
    });
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col shrink-0 border-r border-white/[0.06] bg-ink-900/60 backdrop-blur-sm overflow-hidden"
        style={{ width: collapsed ? 64 : 240, transition: "width 150ms ease-out" }}
      >
        {/* Brand + toggle */}
        <div className="flex h-14 items-center border-b border-white/[0.06] px-3">
          {!collapsed && (
            <span className="flex-1 pl-1 text-sm font-semibold tracking-[-0.2px] text-zinc-100 truncate">
              Bookido
            </span>
          )}
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300 ${collapsed ? "mx-auto" : "ml-auto"}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {!collapsed && (
            <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-700">
              Gestión
            </p>
          )}
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all outline-none focus-visible:ring-1 focus-visible:ring-indigo-400/40 ${
                      active
                        ? "bg-indigo-500/[0.10] text-zinc-100 ring-1 ring-indigo-500/20"
                        : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <span className={active ? "text-indigo-300" : "text-zinc-600"}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!collapsed && active && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.7)]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + logout */}
        <div className="border-t border-white/[0.06] p-2">
          {!collapsed && (
            <div className="mb-1.5 rounded-xl px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-700">Administrador</p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">
                {process.env.NEXT_PUBLIC_ADMIN_EMAIL_DISPLAY ?? "admin@bookido.online"}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={pending}
            title="Cerrar sesión"
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-400 disabled:opacity-40 outline-none focus-visible:ring-1 focus-visible:ring-indigo-400/40 ${collapsed ? "justify-center" : ""}`}
          >
            <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && (
              <span>{pending ? "Saliendo…" : "Cerrar sesión"}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <MobileTopbar />
    </>
  );
}

function MobileTopbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await adminLogoutAction();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-ink-900/80 px-4 h-14 backdrop-blur-sm lg:hidden">
        <span className="text-sm font-semibold tracking-[-0.2px] text-zinc-100">Bookido</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/[0.07] bg-ink-900 lg:hidden">
            <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
              <span className="text-sm font-semibold tracking-[-0.2px] text-zinc-100">Bookido</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <ul className="space-y-0.5">
                {NAV.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? "bg-indigo-500/10 text-zinc-100 ring-1 ring-indigo-500/20"
                            : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                        }`}
                      >
                        <span className={active ? "text-indigo-300" : "text-zinc-600"}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-white/[0.06] p-3">
              <button
                type="button"
                onClick={handleLogout}
                disabled={pending}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-400 disabled:opacity-40"
              >
                <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {pending ? "Saliendo…" : "Cerrar sesión"}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

