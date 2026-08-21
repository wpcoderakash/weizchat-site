import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * The content pipeline for /blog and /information-center (brief §4).
 *
 * A file is the unit: drop `my-post.he.mdx` into the right folder and the
 * article exists — listed, routed, SEO'd, with hreflang to its sibling
 * locale. Nothing to register by hand, which is what makes this a pipeline
 * rather than a hard-coded list.
 *
 * Filenames are `<slug>.<locale>.mdx`, so a slug is shared across locales
 * and the language switcher stays on the same article.
 */
export type Collection = 'blog' | 'information-center';

export interface ArticleMeta {
  slug: string;
  locale: string;
  collection: Collection;
  title: string;
  description: string;
  /** ISO date the text was written. Never back-dated to fake a history. */
  date: string;
  /** Rough reading time in minutes, computed from the body. */
  readingMinutes: number;
}

export interface Article extends ArticleMeta {
  body: string;
}

const ROOT = path.join(process.cwd(), 'src', 'content', 'articles');

function dirFor(collection: Collection) {
  return path.join(ROOT, collection);
}

function parseFilename(file: string): { slug: string; locale: string } | null {
  const match = /^(.+)\.([a-z]{2})\.mdx$/.exec(file);
  return match ? { slug: match[1]!, locale: match[2]! } : null;
}

/** Words per minute for a mixed Hebrew/English business reader. */
function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * YAML turns an unquoted `2026-08-21` into a Date, whose toString() is a
 * long locale string — wrong for a `datetime` attribute and for JSON-LD.
 * Normalise everything to a plain ISO day.
 */
function isoDay(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function read(collection: Collection, file: string): Article | null {
  const parsed = parseFilename(file);
  if (!parsed) return null;
  const full = path.join(dirFor(collection), file);
  // An unknown slug must 404, not crash the route with ENOENT.
  if (!fs.existsSync(full)) return null;
  const { data, content } = matter(fs.readFileSync(full, 'utf8'));
  const date = isoDay(data.date);
  if (!data.title || !data.description || !date) return null;
  return {
    slug: parsed.slug,
    locale: parsed.locale,
    collection,
    title: String(data.title),
    description: String(data.description),
    date,
    readingMinutes: readingMinutes(content),
    body: content,
  };
}

function allFiles(collection: Collection): string[] {
  const dir = dirFor(collection);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
}

/** Newest first. An empty collection is a valid state, not an error. */
export function listArticles(collection: Collection, locale: string): ArticleMeta[] {
  return allFiles(collection)
    .map((file) => read(collection, file))
    .filter((a): a is Article => a !== null && a.locale === locale)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    // Listings carry metadata only — the body stays out of the index payload.
    .map((article) => {
      const meta: ArticleMeta = {
        slug: article.slug,
        locale: article.locale,
        collection: article.collection,
        title: article.title,
        description: article.description,
        date: article.date,
        readingMinutes: article.readingMinutes,
      };
      return meta;
    });
}

export function getArticle(
  collection: Collection,
  slug: string,
  locale: string,
): Article | null {
  return read(collection, `${slug}.${locale}.mdx`);
}

/** Every (slug, locale) pair in a collection — drives generateStaticParams. */
export function articleParams(collection: Collection): { slug: string; locale: string }[] {
  return allFiles(collection)
    .map(parseFilename)
    .filter((p): p is { slug: string; locale: string } => p !== null);
}
