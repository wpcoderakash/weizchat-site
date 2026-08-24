import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { STORE_DIR } from '../lib/paths';

/**
 * Maintenance mode.
 *
 * Deliberately NOT a CMS document with a draft and a publish step. Everything
 * else here is content, where "save now, publish when ready" is right. This is
 * a switch: you reach for it when the site needs to be down *now*, and a
 * two-step workflow at that moment is a trap. Saving applies it.
 *
 * The text is stored for both locales at once, because the switch itself is
 * not per-language — turning it on in English and leaving Hebrew live would
 * be a bug, not a feature.
 */

const FILE = path.join(STORE_DIR, 'maintenance.json');

export const maintenanceSchema = z.object({
  enabled: z.boolean(),
  /** Sent as Retry-After, so crawlers know this is temporary. */
  retryAfterMinutes: z.number().int().min(1).max(10_080),
  en: z.object({ title: z.string().min(1), message: z.string().min(1) }),
  he: z.object({ title: z.string().min(1), message: z.string().min(1) }),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});
export type Maintenance = z.infer<typeof maintenanceSchema>;

export const maintenanceDefault: Maintenance = {
  enabled: false,
  retryAfterMinutes: 60,
  en: {
    title: 'Back shortly',
    message:
      'We are making a short update to the site. Everything will be back in a few minutes — thank you for your patience.',
  },
  he: {
    title: 'חוזרים בקרוב',
    message: 'אנחנו מבצעים עדכון קצר לאתר. הכול יחזור בעוד כמה דקות — תודה על הסבלנות.',
  },
};

/** The current setting. Never throws: a broken file must not take the site down. */
export function readMaintenance(): Maintenance {
  try {
    const parsed = maintenanceSchema.safeParse(JSON.parse(fs.readFileSync(FILE, 'utf8')));
    if (parsed.success) return parsed.data;
    console.error('[cms] maintenance.json failed validation — treating the site as live');
  } catch {
    // Absent is the normal case: the site has never been in maintenance.
  }
  return maintenanceDefault;
}

export function writeMaintenance(next: Maintenance, by?: string): Maintenance {
  const value: Maintenance = { ...next, updatedAt: new Date().toISOString(), updatedBy: by };
  fs.mkdirSync(STORE_DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, FILE);
  return value;
}

/** The page a visitor gets while the site is down. */
export function maintenanceHtml(state: Maintenance, locale: 'en' | 'he'): string {
  const copy = locale === 'he' ? state.he : state.en;
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  // Self-contained: during maintenance the app's own assets may be mid-deploy,
  // so this page depends on nothing it has to fetch.
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escape(copy.title)}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:1.5rem;
         font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
         background:#f6f7f9; color:#14121f; }
  @media (prefers-color-scheme: dark) { body { background:#0e0c14; color:#ece9f4; } }
  main { max-width:32rem; text-align:center; }
  .mark { width:3rem; height:3rem; margin:0 auto 1.25rem; border-radius:14px;
          background:#6d4aff; color:#fff; display:grid; place-items:center;
          font-weight:800; font-size:1.35rem; }
  h1 { font-size:1.6rem; margin:0 0 .6rem; }
  p { margin:0; line-height:1.6; opacity:.8; }
</style>
</head>
<body>
  <main>
    <div class="mark">W</div>
    <h1>${escape(copy.title)}</h1>
    <p>${escape(copy.message)}</p>
  </main>
</body>
</html>`;
}
