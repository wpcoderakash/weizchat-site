import fs from 'node:fs';
import path from 'node:path';
import { landingPageSchema, type LandingPage } from './schema';
import { homeEN } from './content/home.en';
import { homeHE } from './content/home.he';

/**
 * The CMS store.
 *
 * Content lives as one JSON document per page-and-locale under
 * `content-store/`, written by the admin at /admin and read by the page.
 * A file store rather than a database, deliberately: this site had no
 * backend at all, a marketing page does not need one, publishing is
 * instant, and the result is diffable and trivially backed up. ADR-0008
 * puts us on a persistent host, so the filesystem is durable.
 *
 * Its limits, named rather than discovered: writes are last-writer-wins
 * with no locking, and a multi-instance deployment would need shared
 * storage or a database. Both are contained by this module — the rest of
 * the site only ever calls `getLandingPage`.
 *
 * The TypeScript content files are the FALLBACK, not dead code: an empty
 * store, a corrupt document or a schema that has moved on all fall back
 * to a page that renders, and the reason is logged. A marketing site that
 * 500s because a CMS record is malformed is worse than one showing
 * last-known-good copy.
 */

const BUILT_IN: Record<string, LandingPage> = { en: homeEN, he: homeHE };

const STORE_DIR = path.join(process.cwd(), 'content-store');

function fileFor(slug: string, locale: string): string {
  // Locale and slug are ours, never user input, but keep the join tight.
  return path.join(STORE_DIR, `${slug}.${locale}.json`);
}

function builtIn(locale: string): LandingPage {
  return BUILT_IN[locale] ?? BUILT_IN['en']!;
}

/**
 * The page as the site should render it: the stored document when there is
 * a valid published one, otherwise the built-in content.
 */
export function getLandingPage(locale: string): LandingPage {
  const file = fileFor('home', locale);
  if (!fs.existsSync(file)) return builtIn(locale);

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`[cms] ${file} is not valid JSON — serving built-in content`, error);
    return builtIn(locale);
  }

  const parsed = landingPageSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[cms] ${file} failed validation — serving built-in content`, parsed.error.issues);
    return builtIn(locale);
  }

  // An unpublished draft is not what a visitor sees.
  return parsed.data.published ? parsed.data : builtIn(locale);
}

/** The stored document even when unpublished — the editor and preview. */
export function getLandingDraft(locale: string): LandingPage {
  const file = fileFor('home', locale);
  if (!fs.existsSync(file)) return builtIn(locale);
  try {
    const parsed = landingPageSchema.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')));
    return parsed.success ? parsed.data : builtIn(locale);
  } catch {
    return builtIn(locale);
  }
}

/** Validates before it writes: the store never holds a document the page cannot render. */
export function saveLandingPage(locale: string, page: unknown): LandingPage {
  const parsed = landingPageSchema.parse(page);
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(fileFor('home', locale), `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  return parsed;
}

/** Drops the stored document, so the built-in content takes over again. */
export function resetLandingPage(locale: string): void {
  const file = fileFor('home', locale);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function builtInLandingPage(locale: string): LandingPage {
  return builtIn(locale);
}
