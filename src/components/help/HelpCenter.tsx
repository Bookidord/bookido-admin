"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { renderMd, type Guide } from "@/lib/help/guides";

type Props = {
  guides: Guide[];
  initialSlug: string;
};

export function HelpCenter({ guides, initialSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);

  const currentSlug = searchParams.get("g") ?? initialSlug;
  const current = guides.find((g) => g.slug === currentSlug) ?? guides[0];

  // Mobile: show list or content
  const [mobileView, setMobileView] = useState<"list" | "content">(
    searchParams.get("g") ? "content" : "list",
  );

  const selectGuide = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("g", slug);
      router.push(`?${params.toString()}`, { scroll: false });
      setMobileView("content");
    },
    [router, searchParams],
  );

  // Scroll content to top when guide changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [current.slug]);

  const html = renderMd(current.body);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 overflow-y-auto border-r border-white/[0.07]
          bg-ink-900/60 backdrop-blur-sm
          w-full lg:w-72 xl:w-80
          ${mobileView === "content" ? "hidden lg:flex lg:flex-col" : "flex flex-col"}
        `}
      >
        <div className="px-5 pb-3 pt-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#14F195]/50">
            Centro de ayuda
          </p>
          <h2 className="mt-1 font-future text-lg font-semibold text-white">
            Guías
          </h2>
        </div>

        <nav className="flex-1 px-3 pb-6">
          <ul className="space-y-0.5">
            {guides.map((guide) => {
              const active = guide.slug === current.slug;
              return (
                <li key={guide.slug}>
                  <button
                    type="button"
                    onClick={() => selectGuide(guide.slug)}
                    className={`
                      group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left
                      transition-all duration-200
                      ${
                        active
                          ? "bg-[#14F195]/[0.10] text-white ring-1 ring-[#14F195]/20"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                      }
                    `}
                  >
                    <span
                      className={`mt-0.5 flex-shrink-0 text-base leading-none transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`}
                      aria-hidden
                    >
                      {guide.icon}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium leading-snug ${active ? "text-white" : ""}`}
                      >
                        {guide.title}
                      </p>
                      <p
                        className={`mt-0.5 text-xs leading-snug ${active ? "text-[#14F195]/50" : "text-zinc-600"}`}
                      >
                        {guide.description}
                      </p>
                    </div>
                    {active && (
                      <span className="ml-auto mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-[#14F195] shadow-[0_0_6px_rgba(20,241,149,0.7)]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer links */}
        <div className="border-t border-white/[0.06] px-5 py-4">
          <p className="text-xs text-zinc-600">
            ¿No encuentras lo que buscas?{" "}
            <a
              href="mailto:soporte@bookido.app"
              className="text-[#14F195]/70 transition hover:text-[#14F195]"
            >
              Escríbenos
            </a>
          </p>
        </div>
      </aside>

      {/* ── Content panel ─────────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        className={`
          flex-1 overflow-y-auto
          ${mobileView === "list" ? "hidden lg:block" : "block"}
        `}
      >
        {/* Mobile back button */}
        <div className="lg:hidden border-b border-white/[0.07] bg-ink-900/40 px-5 py-3">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Todas las guías
          </button>
        </div>

        {/* Article */}
        <article className="mx-auto max-w-3xl px-6 py-10 lg:px-12 lg:py-14">
          {/* Header */}
          <div className="mb-10 border-b border-white/[0.08] pb-8">
            <span className="text-3xl leading-none" aria-hidden>
              {current.icon}
            </span>
            <h1 className="mt-4 font-future text-2xl font-semibold text-white md:text-3xl">
              {current.title}
            </h1>
            <p className="mt-2 text-base text-zinc-400">{current.description}</p>
          </div>

          {/* Markdown body */}
          <div
            className="help-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Navigation between guides */}
          <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.08] pt-8 sm:flex-row sm:justify-between">
            {(() => {
              const idx = guides.findIndex((g) => g.slug === current.slug);
              const prev = guides[idx - 1];
              const next = guides[idx + 1];
              return (
                <>
                  <div>
                    {prev && (
                      <button
                        type="button"
                        onClick={() => selectGuide(prev.slug)}
                        className="group flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/40 px-4 py-3 text-left transition hover:border-[#14F195]/25 hover:bg-[#14F195]/[0.05]"
                      >
                        <svg
                          className="h-4 w-4 flex-shrink-0 text-zinc-500 transition group-hover:text-[#14F195]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                            Anterior
                          </p>
                          <p className="text-sm font-medium text-zinc-300 group-hover:text-white">
                            {prev.title}
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                  <div>
                    {next && (
                      <button
                        type="button"
                        onClick={() => selectGuide(next.slug)}
                        className="group flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/40 px-4 py-3 text-right transition hover:border-[#14F195]/25 hover:bg-[#14F195]/[0.05]"
                      >
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                            Siguiente
                          </p>
                          <p className="text-sm font-medium text-zinc-300 group-hover:text-white">
                            {next.title}
                          </p>
                        </div>
                        <svg
                          className="h-4 w-4 flex-shrink-0 text-zinc-500 transition group-hover:text-[#14F195]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </article>
      </div>
    </div>
  );
}
