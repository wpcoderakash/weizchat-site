import { wantsDraft } from '../cms/load';
import { publicPost, publicPosts, type Collection } from '../cms/posts';
import { listStored } from '../cms/docs';
import { mdxPostFiles } from '../cms/defaults';

/**
 * The article surface the pages consume — same shape as before the CMS,
 * now backed by the merged corpus: CMS posts override their MDX twins,
 * new CMS posts simply exist, and draft mode (admin-gated) shows drafts.
 */
export type { Collection };

export interface ArticleMeta {
  slug: string;
  locale: string;
  collection: Collection;
  title: string;
  description: string;
  date: string;
  readingMinutes: number;
  tags: string[];
}

export interface Article extends ArticleMeta {
  body: string;
}

/** Words per minute for a mixed Hebrew/English business reader. */
function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.trim().split(/\s+/).length / 200));
}

export async function listArticles(collection: Collection, locale: string): Promise<ArticleMeta[]> {
  const draft = await wantsDraft();
  return publicPosts(collection, locale, draft).map(({ slug, doc }) => ({
    slug,
    locale,
    collection,
    title: doc.title,
    description: doc.description,
    date: doc.date,
    readingMinutes: readingMinutes(doc.body),
    tags: doc.tags,
  }));
}

export async function getArticle(
  collection: Collection,
  slug: string,
  locale: string,
): Promise<Article | null> {
  const draft = await wantsDraft();
  const doc = publicPost(collection, slug, locale, draft);
  if (!doc) return null;
  return {
    slug,
    locale,
    collection,
    title: doc.title,
    description: doc.description,
    date: doc.date,
    readingMinutes: readingMinutes(doc.body),
    tags: doc.tags,
    body: doc.body,
  };
}

/** Build-time params: the MDX corpus plus every stored post. */
export function articleParams(collection: Collection): { slug: string; locale: string }[] {
  const out: { slug: string; locale: string }[] = [];
  for (const file of mdxPostFiles(collection)) {
    const m = /^(.+)\.([a-z]{2})\.mdx$/.exec(file);
    if (m) out.push({ slug: m[1]!, locale: m[2]! });
  }
  for (const { slug, locale } of listStored('post')) {
    const i = slug.indexOf('--');
    if (i > 0 && slug.slice(0, i) === collection) out.push({ slug: slug.slice(i + 2), locale });
  }
  return out;
}
