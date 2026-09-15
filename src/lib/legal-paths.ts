/**
 * The documents that stay readable while the site is in maintenance.
 *
 * These are not ordinary marketing pages. Meta's app configuration points at
 * the SaaS at app.weiz.chat, whose /privacy, /terms and /data-deletion
 * redirect here (ADR-0050 in the app repo), so a 503 on these paths breaks a
 * Meta-facing URL rather than merely hiding a page. The app already exempts
 * its own legal routes from its own maintenance screen (ADR-0046); this is the
 * same rule on this side of the redirect.
 *
 * Marketing pages stay behind the screen: the point of maintenance is that
 * nobody reads a half-finished home page, and a privacy policy is never
 * half-finished — it is published or it is not.
 *
 * Pure and dependency-free so it can be checked without a server.
 */
const LEGAL_SEGMENTS = [
  'privacy-policy',
  'terms',
  'dpa',
  'data-deletion',
  'security',
  'accessibility',
] as const;

/** Hebrew sits under `/heb`; English is the bare path. */
const LOCALE_PREFIXES = ['', '/heb'] as const;

const LEGAL_PATHS: ReadonlySet<string> = new Set(
  LOCALE_PREFIXES.flatMap((prefix) => LEGAL_SEGMENTS.map((segment) => `${prefix}/${segment}`)),
);

export function isLegalPath(pathname: string): boolean {
  return LEGAL_PATHS.has(pathname.replace(/\/+$/, '') || '/');
}
