"use client";

import { useState, useEffect, useCallback } from "react";

type SyncState = "ok" | "syncing" | "offline";

export function StatusSync() {
  const [state, setState] = useState<SyncState>("syncing");

  const checkHealth = useCallback(async () => {
    if (!navigator.onLine) {
      setState("offline");
      return;
    }
    setState("syncing");
    try {
      const res = await fetch("http://localhost:4000/health", { signal: AbortSignal.timeout(5000) });
      setState(res.ok ? "ok" : "offline");
    } catch {
      setState("offline");
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 30000);

    const goOnline = () => checkHealth();
    const goOffline = () => setState("offline");
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      clearInterval(id);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [checkHealth]);

  const config: Record<SyncState, { label: string; color: string }> = {
    ok:      { label: "✓ Sincronizado",      color: "var(--accent-hex)" },
    syncing: { label: "↻ Sincronizando...",   color: "#f59e0b" },
    offline: { label: "⚠ Sin conexión",       color: "#ef4444" },
  };

  const { label, color } = config[state];

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06]"
      style={{ background: "var(--ink-900)" }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="text-white/40 text-[11px]" style={{ fontFamily: "monospace", color }}>
        {label}
      </span>
    </div>
  );
}
