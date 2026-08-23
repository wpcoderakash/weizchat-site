import {
  docStatus,
  listStored,
  publishDoc,
  readEnvelope,
  resetDoc,
  saveDraft,
  unpublishDoc,
  type DocStatus,
} from './docs';
import { postDocSchema, type PostDoc } from './site-schema';
import { mdxPostDefault, mdxPostFiles } from './defaults';

/**
 * Posts: the blog and the information center.
 *
 * The MDX files that shipped with the site remain the built-in corpus; a
 * CMS post with the same collection and slug overrides its MDX twin, and
 * new posts exist only in the store. Storage slugs are
 * `{collection}--{slug}` so both collections share the 'post' kind.
 */
export type Collection = 'blog' | 'information-center';

const SEP = '--';

export function storageSlug(collection: Collection, slug: string): string {
  return `${collection}${SEP}${slug}`;
}

function splitStorageSlug(stored: string): { collection: Collection; slug: string } | null {
  const i = stored.indexOf(SEP);
  if (i < 0) return null;
  const collection = stored.slice(0, i);
  if (collection !== 'blog' && collection !== 'information-center') return null;
  return { collection, slug: stored.slice(i + SEP.length) };
}

export interface PostSummary {
  collection: Collection;
  slug: string;
  locale: string;
  doc: PostDoc;
  /** Where the content lives — mdx built-in, or the store. */
  source: 'mdx' | 'cms';
}

/** Everything the ADMIN sees: drafts included, MDX built-ins included. */
export function adminListPosts(): (PostSummary & { status: DocStatus })[] {
  const out: (PostSummary & { status: DocStatus })[] = [];
  const seen = new Set<string>();

  for (const { slug: stored, locale } of listStored('post')) {
    const parts = splitStorageSlug(stored);
    if (!parts) continue;
    const env = readEnvelope(postDocSchema, 'post', stored, locale);
    if (!env) continue;
    seen.add(`${stored}.${locale}`);
    out.push({
      ...parts,
      locale,
      doc: env.draft,
      source: 'cms',
      status: docStatus(postDocSchema, 'post', stored, locale),
    });
  }

  for (const collection of ['blog', 'information-center'] as const) {
    for (const file of mdxPostFiles(collection)) {
      const m = /^(.+)\.([a-z]{2})\.mdx$/.exec(file);
      if (!m) continue;
      const [, slug, locale] = m as unknown as [string, string, string];
      if (seen.has(`${storageSlug(collection, slug)}.${locale}`)) continue;
      const doc = mdxPostDefault(collection, slug, locale);
      if (!doc) continue;
      out.push({
        collection,
        slug,
        locale,
        doc,
        source: 'mdx',
        status: { hasDraft: false, isPublished: true, dirty: false, updatedAt: null },
      });
    }
  }
  return out.sort((a, b) => (a.doc.date < b.doc.date ? 1 : -1));
}

/** What the PUBLIC site lists: published CMS posts over the MDX corpus. */
export function publicPosts(collection: Collection, locale: string, draft: boolean): PostSummary[] {
  const out = new Map<string, PostSummary>();

  for (const file of mdxPostFiles(collection)) {
    const m = /^(.+)\.([a-z]{2})\.mdx$/.exec(file);
    if (!m || m[2] !== locale) continue;
    const doc = mdxPostDefault(collection, m[1]!, locale);
    if (doc) out.set(m[1]!, { collection, slug: m[1]!, locale, doc, source: 'mdx' });
  }

  for (const { slug: stored, locale: l } of listStored('post')) {
    if (l !== locale) continue;
    const parts = splitStorageSlug(stored);
    if (!parts || parts.collection !== collection) continue;
    const env = readEnvelope(postDocSchema, 'post', stored, locale);
    if (!env) continue;
    const doc = draft ? env.draft : env.published;
    if (doc) out.set(parts.slug, { ...parts, locale, doc, source: 'cms' });
    // A CMS override that is UNPUBLISHED hides nothing: without a published
    // version the MDX built-in (if any) stays live, which is the fallback
    // rule everywhere else in this store.
  }

  return [...out.values()].sort((a, b) => (a.doc.date < b.doc.date ? 1 : -1));
}

export function publicPost(
  collection: Collection,
  slug: string,
  locale: string,
  draft: boolean,
): PostDoc | null {
  const stored = storageSlug(collection, slug);
  const fallback = mdxPostDefault(collection, slug, locale);
  if (draft) {
    const env = readEnvelope(postDocSchema, 'post', stored, locale);
    return env?.draft ?? env?.published ?? fallback;
  }
  const env = readEnvelope(postDocSchema, 'post', stored, locale);
  return env?.published ?? fallback;
}

// Thin admin wrappers so routes never touch the generic store directly.
export const postsAdmin = {
  read(collection: Collection, slug: string, locale: string): PostDoc | null {
    const stored = storageSlug(collection, slug);
    const env = readEnvelope(postDocSchema, 'post', stored, locale);
    return env?.draft ?? env?.published ?? mdxPostDefault(collection, slug, locale);
  },
  save: (c: Collection, s: string, l: string, data: unknown, by?: string) =>
    saveDraft(postDocSchema, 'post', storageSlug(c, s), l, data, by),
  publish: (c: Collection, s: string, l: string, by?: string) =>
    publishDoc(postDocSchema, 'post', storageSlug(c, s), l, by),
  unpublish: (c: Collection, s: string, l: string, by?: string) =>
    unpublishDoc(postDocSchema, 'post', storageSlug(c, s), l, by),
  reset: (c: Collection, s: string, l: string) => resetDoc('post', storageSlug(c, s), l),
  status: (c: Collection, s: string, l: string) => docStatus(postDocSchema, 'post', storageSlug(c, s), l),
};
