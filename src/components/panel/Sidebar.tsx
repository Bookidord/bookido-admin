"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

const NAV: NavItem[] = [
  {
    href: "/panel", label: "Inicio", exact: true,
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: "/panel/reservas", label: "Reservas",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    href: "/panel/campanas", label: "Campañas",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  },
  {
    href: "/panel/clientes", label: "Clientes",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" /><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
  {
    href: "/panel/calendario", label: "Calendario",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" /><line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" /><line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    href: "/panel/productos", label: "Productos",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  },
  {
    href: "/panel/servicios", label: "Servicios",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  },
  {
    href: "/panel/configuracion", label: "Configuración",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: "/ayuda", label: "Guías",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
];

type Props = { userEmail: string | undefined; instagram?: string; facebook?: string; whatsapp?: string };

export function Sidebar({ userEmail, instagram, facebook, whatsapp }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  // Full sidebar content (used in mobile drawer + expanded desktop)
  const FullContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4">
        <Link href="/panel" className="flex items-center gap-3 transition hover:opacity-80">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#14F195] shadow-[0_0_16px_rgba(20,241,149,0.3)]">
            <span className="text-xs font-bold text-[#0A0A0F]">B</span>
          </div>
          <div>
            <p className="font-future text-sm font-semibold text-white">Bookido</p>
            <p className="text-[10px] text-zinc-500">Panel</p>
          </div>
        </Link>
        <button
          onClick={() => { setCollapsed(true); setMobileOpen(false); }}
          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Colapsar menú"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">Menú</p>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${active ? "bg-[#14F195]/[0.10] text-white ring-1 ring-[#14F195]/20" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}`}
                >
                  <span className={active ? "text-[#14F195]" : "text-zinc-500"}>{item.icon}</span>
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#14F195] shadow-[0_0_6px_rgba(20,241,149,0.7)]" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/[0.07] p-4">
        {/* Social links */}
        {(instagram || facebook || whatsapp) && (
          <div className="mb-3 flex items-center gap-2">
            {instagram && (
              <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 transition hover:bg-pink-500/15 hover:text-pink-400" title="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {facebook && (
              <a href={facebook.startsWith("http") ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 transition hover:bg-blue-500/15 hover:text-blue-400" title="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 transition hover:bg-emerald-500/15 hover:text-emerald-400" title="WhatsApp">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            )}
          </div>
        )}
        <div className="mb-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Sesión activa</p>
          <p className="mt-0.5 truncate text-xs font-medium text-zinc-300">{userEmail ?? "—"}</p>
        </div>
        <button
          type="button" onClick={handleSignOut} disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {signingOut ? "Saliendo…" : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );

  // Icon-only collapsed rail
  const CollapsedRail = () => (
    <div className="flex h-full flex-col items-center py-3 gap-1">
      {/* Hamburger toggle */}
      <button
        onClick={() => setCollapsed(false)}
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
        aria-label="Expandir menú"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Brand dot */}
      <Link href="/panel" className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#14F195] shadow-[0_0_14px_rgba(20,241,149,0.3)] transition hover:opacity-80">
        <span className="text-xs font-bold text-[#0A0A0F]">B</span>
      </Link>

      {/* Nav icons */}
      {NAV.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`group relative flex h-9 w-9 items-center justify-center rounded-xl transition ${active ? "bg-[#14F195]/10 text-[#14F195] ring-1 ring-[#14F195]/20" : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"}`}
          >
            {item.icon}
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Social icons */}
      {(instagram || facebook || whatsapp) && (
        <div className="mt-auto flex flex-col items-center gap-1 pb-1">
          {instagram && (
            <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" title="Instagram"
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-pink-500/15 hover:text-pink-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">Instagram</span>
            </a>
          )}
          {facebook && (
            <a href={facebook.startsWith("http") ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noopener noreferrer" title="Facebook"
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-blue-500/15 hover:text-blue-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">Facebook</span>
            </a>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-emerald-500/15 hover:text-emerald-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">WhatsApp</span>
            </a>
          )}
        </div>
      )}

      {/* Logout at bottom */}
      <button
        type="button" onClick={handleSignOut} disabled={signingOut} title="Cerrar sesión"
        className={`group relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.06] hover:text-zinc-300 ${!(instagram || facebook || whatsapp) ? "mt-auto" : ""}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
          Cerrar sesión
        </span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — auto-expands on hover */}
      <aside
        className={`hidden flex-shrink-0 border-r border-white/[0.07] bg-ink-900/70 backdrop-blur-sm transition-all duration-200 lg:flex lg:flex-col ${collapsed ? "w-14" : "w-60"}`}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        {collapsed ? <CollapsedRail /> : <FullContent />}
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-ink-900/80 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#14F195]">
            <span className="text-xs font-bold text-white">B</span>
          </div>
          <span className="font-future text-sm font-semibold text-white">Bookido</span>
        </div>
        <button
          type="button" onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.07] bg-ink-900 lg:hidden">
            <button
              type="button" onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 hover:text-white transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <FullContent />
          </aside>
        </>
      )}
    </>
  );
}
