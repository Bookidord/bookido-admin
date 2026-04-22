export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-10">
      {/* Header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-3 w-36 rounded bg-white/[0.05] animate-pulse" />
        <div className="h-7 w-32 rounded-lg bg-white/[0.05] animate-pulse" />
        <div className="h-3 w-56 rounded bg-white/[0.04] animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-4 space-y-2">
            <div className="h-2.5 w-24 rounded bg-white/[0.05] animate-pulse" />
            <div className="h-7 w-12 rounded-lg bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-white/[0.06] bg-ink-900/40">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="h-4 w-40 rounded bg-white/[0.05] animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0">
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 rounded bg-white/[0.05] animate-pulse" />
              <div className="h-2.5 w-28 rounded bg-white/[0.04] animate-pulse" />
            </div>
            <div className="h-5 w-16 rounded-full bg-white/[0.05] animate-pulse" />
            <div className="h-4 w-14 rounded bg-white/[0.05] animate-pulse" />
            <div className="h-7 w-16 rounded-lg bg-white/[0.05] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
