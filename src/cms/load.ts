import { draftMode } from 'next/headers';
import { isSignedIn } from './auth';
import { draftDoc, publishedDoc } from './docs';
import { globalDocSchema } from './site-schema';
import type { GlobalDoc } from './site-schema';
import { globalDefault } from './defaults';
import { pageBySlug, type PageDef } from './registry';

/**
 * What the frontend reads.
 *
 * Preview is Next's own draft mode, gated twice: the draft cookie must be
 * set AND the CMS session must be valid. That means "preview" is the real
 * public route rendering the draft — the same file, the same components,
 * the same layout — which is the only preview that cannot drift from the
 * published page. An anonymous visitor with a stolen draft cookie still
 * sees published content, because the session check fails.
 */
export async function wantsDraft(): Promise<boolean> {
  try {
    const { isEnabled } = await draftMode();
    return isEnabled && (await isSignedIn());
  } catch {
    // Outside a request scope (build-time prerender): published only.
    return false;
  }
}

export async function getPageDoc<T>(slug: string, locale: string): Promise<T> {
  const def = pageBySlug(slug);
  if (!def) throw new Error(`[cms] unknown page: ${slug}`);
  const builtIn = def.builtIn(locale) as T;
  const schema = def.schema as Parameters<typeof publishedDoc>[0];
  return (await wantsDraft())
    ? (draftDoc(schema, 'page', slug, locale, builtIn) as T)
    : (publishedDoc(schema, 'page', slug, locale, builtIn) as T);
}

export async function getGlobal(locale: string): Promise<GlobalDoc> {
  const builtIn = globalDefault(locale);
  return (await wantsDraft())
    ? draftDoc(globalDocSchema, 'global', 'site', locale, builtIn)
    : publishedDoc(globalDocSchema, 'global', 'site', locale, builtIn);
}

/**
 * The paths a page's publish must revalidate. Hebrew appears twice on
 * purpose: `/he/...` is the internal route the cache may be keyed by, and
 * `/heb/...` is the public alias the middleware serves — invalidating only
 * one of them leaves a stale copy behind the other.
 */
export function pathsToRevalidate(def: PageDef): string[] {
  const suffix = def.publicPath;
  return suffix === ''
    ? ['/en', '/he', '/heb']
    : [`/en${suffix}`, `/he${suffix}`, `/heb${suffix}`];
}
