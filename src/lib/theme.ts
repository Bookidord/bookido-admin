/**
 * Tenant theming — generates CSS :root declarations from a hex color.
 * Inject via: <style dangerouslySetInnerHTML={{ __html: buildThemeStyle({...}) }} />
 *
 * CSS vars exposed:
 *   --primary     R G B  → used as rgb(var(--primary) / 0.x)
 *   --primary-hex #rrggbb → used as var(--primary-hex) for solid color
 *   --hero        R G B  → landing hero accent (defaults to primary)
 *   --hero-hex    #rrggbb
 */

/** Convert "#rrggbb" → "rr gg bb" (space-sep for CSS rgb() / color-mix()) */
export function hexToRgbParts(hex: string, fallback = "20 241 149"): string {
  try {
    const c = hex.replace(/^#/, "").padEnd(6, "0");
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    if ([r, g, b].some(isNaN)) return fallback;
    return `${r} ${g} ${b}`;
  } catch {
    return fallback;
  }
}

/**
 * Build the CSS string for tenant theme variables.
 * - primary: booking page accent, calendar, panel highlights
 * - hero:    landing hero gradient/accent (falls back to primary if omitted)
 */
export function buildThemeStyle({
  primary,
  hero,
}: {
  primary?: string | null;
  hero?: string | null;
}): string {
  const p = primary || "#14F195";
  const h = hero    || p;
  const pr = hexToRgbParts(p);
  const hr = hexToRgbParts(h);
  // Compact single-line — no newlines needed, this goes inside <style>
  return (
    `:root{` +
    `--primary:${pr};` +
    `--primary-hex:${p};` +
    `--hero:${hr};` +
    `--hero-hex:${h};` +
    `}`
  );
}
