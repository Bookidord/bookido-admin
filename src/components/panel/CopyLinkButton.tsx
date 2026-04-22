"use client";

import { useState } from "react";

export function CopyLinkButton({ bookingUrl }: { bookingUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = bookingUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-900/40 px-4 py-3.5 text-sm text-zinc-300 transition hover:border-[#14F195]/20 hover:bg-[#14F195]/[0.04] hover:text-white w-full text-left"
    >
      <svg
        className="h-4 w-4 flex-shrink-0 text-zinc-500"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
      <span className="flex-1 truncate font-mono text-xs">{bookingUrl}</span>
      <span className="flex-shrink-0 text-xs text-zinc-500 transition">
        {copied ? "✓ Copiado" : "Copiar"}
      </span>
    </button>
  );
}
