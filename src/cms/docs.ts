import fs from 'node:fs';
import path from 'node:path';
import type { z } from 'zod';

/**
 * The generic CMS document store (ADR-0032, extended site-wide).
 *
 * Every editable thing on the site is a document: a page, the global
 * chrome, a blog post. A document is stored as one JSON file holding TWO
 * versions:
 *
 *   { draft, published, updatedAt }
 *
 * Saving writes the draft. Publishing copies the draft over `published`.
 * The public site reads `published` only; the editor and preview read the
 * draft. That is the whole workflow — no state machine, no history table,
 * and "Saved" can never silently mean "live".
 *
 * Fallbacks are the design, not an accident: a missing file, invalid
 * JSON, or a document that fails schema validation all yield the built-in
 * content the site ships with, and log why. The marketing site must
 * render something sensible with an empty or corrupted store.
 */

export type DocKind = 'page' | 'global' | 'post';

export interface Envelope<T> {
  draft: T;
  published: T | null;
  updatedAt: string;
  /** Who last touched it, and what they did — the activity feed's truth. */
  updatedBy?: string;
  lastAction?: 'saved' | 'published' | 'unpublished';
}

const STORE_DIR = path.join(process.cwd(), 'content-store');

/** Slugs and locales are ours or validated upstream; keep the join tight anyway. */
function fileFor(kind: DocKind, slug: string, locale: string): string {
  const safe = (s: string) => s.replace(/[^a-z0-9-]/gi, '');
  return path.join(STORE_DIR, kind, `${safe(slug)}.${safe(locale)}.json`);
}

export function readEnvelope<T>(
  schema: z.ZodType<T>,
  kind: DocKind,
  slug: string,
  locale: string,
): Envelope<T> | null {
  const file = fileFor(kind, slug, locale);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      draft?: unknown;
      published?: unknown;
      updatedAt?: unknown;
      updatedBy?: unknown;
      lastAction?: unknown;
    };
    const draft = schema.safeParse(raw.draft);
    if (!draft.success) {
      console.error(`[cms] ${file} draft failed validation — using built-in`, draft.error.issues[0]);
      return null;
    }
    let published: T | null = null;
    if (raw.published !== null && raw.published !== undefined) {
      const parsed = schema.safeParse(raw.published);
      if (parsed.success) published = parsed.data;
      else console.error(`[cms] ${file} published failed validation — treating as unpublished`);
    }
    return {
      draft: draft.data,
      published,
      updatedAt: String(raw.updatedAt ?? ''),
      updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : undefined,
      lastAction: raw.lastAction as Envelope<T>['lastAction'],
    };
  } catch (error) {
    console.error(`[cms] ${file} unreadable — using built-in`, error);
    return null;
  }
}

/** What a visitor sees: the published version, else the built-in content. */
export function publishedDoc<T>(
  schema: z.ZodType<T>,
  kind: DocKind,
  slug: string,
  locale: string,
  builtIn: T,
): T {
  return readEnvelope(schema, kind, slug, locale)?.published ?? builtIn;
}

/** What the editor and preview see: draft, else published, else built-in. */
export function draftDoc<T>(
  schema: z.ZodType<T>,
  kind: DocKind,
  slug: string,
  locale: string,
  builtIn: T,
): T {
  const env = readEnvelope(schema, kind, slug, locale);
  return env?.draft ?? env?.published ?? builtIn;
}

export interface DocStatus {
  hasDraft: boolean;
  isPublished: boolean;
  /** The draft differs from what is live. */
  dirty: boolean;
  updatedAt: string | null;
}

export function docStatus<T>(
  schema: z.ZodType<T>,
  kind: DocKind,
  slug: string,
  locale: string,
): DocStatus {
  const env = readEnvelope(schema, kind, slug, locale);
  if (!env) return { hasDraft: false, isPublished: false, dirty: false, updatedAt: null };
  return {
    hasDraft: true,
    isPublished: env.published !== null,
    dirty: JSON.stringify(env.draft) !== JSON.stringify(env.published),
    updatedAt: env.updatedAt || null,
  };
}

function write<T>(kind: DocKind, slug: string, locale: string, env: Envelope<T>): void {
  const file = fileFor(kind, slug, locale);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(env, null, 2)}\n`, 'utf8');
}

/** Validates before writing: the store never holds an unrenderable draft. */
export function saveDraft<T>(
  schema: z.ZodType<T>,
  kind: DocKind,
  slug: string,
  locale: string,
  data: unknown,
  by?: string,
): T {
  const parsed = schema.parse(data);
  const existing = readEnvelope(schema, kind, slug, locale);
  write(kind, slug, locale, {
    draft: parsed,
    published: existing?.published ?? null,
    updatedAt: new Date().toISOString(),
    updatedBy: by,
    lastAction: 'saved',
  });
  return parsed;
}

/** Draft becomes the live version. Returns it for the response. */
export function publishDoc<T>(
  schema: z.ZodType<T>,
  kind: DocKind,
  slug: string,
  locale: string,
  by?: string,
): T | null {
  const env = readEnvelope(schema, kind, slug, locale);
  if (!env) return null;
  write(kind, slug, locale, {
    ...env,
    published: env.draft,
    updatedAt: new Date().toISOString(),
    updatedBy: by,
    lastAction: 'published',
  });
  return env.draft;
}

/** Takes the document off the public site; the draft is kept. */
export function unpublishDoc<T>(
  schema: z.ZodType<T>,
  kind: DocKind,
  slug: string,
  locale: string,
  by?: string,
): boolean {
  const env = readEnvelope(schema, kind, slug, locale);
  if (!env) return false;
  write(kind, slug, locale, {
    ...env,
    published: null,
    updatedAt: new Date().toISOString(),
    updatedBy: by,
    lastAction: 'unpublished',
  });
  return true;
}

/** Deletes the stored document entirely; built-in content takes over. */
export function resetDoc(kind: DocKind, slug: string, locale: string): boolean {
  const file = fileFor(kind, slug, locale);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  return true;
}

/** Every stored document of a kind — the posts listing needs this. */
export function listStored(kind: DocKind): { slug: string; locale: string }[] {
  const dir = path.join(STORE_DIR, kind);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => /^(.+)\.([a-z]{2})\.json$/.exec(f))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ slug: m[1]!, locale: m[2]! }));
}

export interface ActivityRow {
  kind: DocKind;
  slug: string;
  locale: string;
  updatedAt: string;
  updatedBy: string | null;
  action: 'saved' | 'published' | 'unpublished';
  isPublished: boolean;
}

/**
 * The activity feed, read straight from the envelopes on disk. It shows
 * only what genuinely happened — no synthetic history, and documents
 * never touched simply are not in it.
 */
export function recentActivity(limit = 10): ActivityRow[] {
  const rows: ActivityRow[] = [];
  for (const kind of ['page', 'global', 'post'] as const) {
    for (const { slug, locale } of listStored(kind)) {
      const dir = path.join(STORE_DIR, kind, `${slug}.${locale}.json`);
      try {
        const raw = JSON.parse(fs.readFileSync(dir, 'utf8')) as {
          updatedAt?: string;
          updatedBy?: string;
          lastAction?: ActivityRow['action'];
          published?: unknown;
        };
        if (!raw.updatedAt) continue;
        rows.push({
          kind,
          slug,
          locale,
          updatedAt: raw.updatedAt,
          updatedBy: raw.updatedBy ?? null,
          action: raw.lastAction ?? 'saved',
          isPublished: raw.published !== null && raw.published !== undefined,
        });
      } catch {
        // An unreadable file is reported by the loaders; the feed skips it.
      }
    }
  }
  return rows.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, limit);
}
