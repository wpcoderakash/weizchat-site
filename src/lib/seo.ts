import type { Metadata } from 'next';

/**
 * hreflang + og:locale plumbing (brief SECTION 3).
 *
 * English is the default and unprefixed; Hebrew sits under `/heb`. The
 * hreflang KEY stays `he` — `heb` is a URL segment, not a language tag,
 * and putting it in hreflang would make the annotation invalid.
 */
const OG_LOCALES: Record<string, string> = { he: 'he_IL', en: 'en_US' };

/** The URL prefix per locale. Mirrors routing.localePrefix.prefixes. */
export const LOCALE_PREFIX: Record<string, string> = { en: '', he: '/heb' };

export function alternatesFor(path: string): Metadata['alternates'] {
  const clean = path === '/' ? '' : path;
  return {
    languages: {
      en: clean || '/',
      he: `${LOCALE_PREFIX['he']}${clean}` || LOCALE_PREFIX['he'],
      'x-default': clean || '/',
    },
  };
}

export function openGraphLocale(locale: string) {
  return {
    locale: OG_LOCALES[locale] ?? 'en_US',
    alternateLocale: Object.entries(OG_LOCALES)
      .filter(([key]) => key !== locale)
      .map(([, value]) => value),
  };
}

import type { CmsSeo } from '../cms/schema';

/** Metadata from a document's SEO block — one implementation for every page. */
export function metaFromSeo(seo: CmsSeo, path: string, locale: string): Metadata {
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      ...alternatesFor(path),
      ...(seo.canonical ? { canonical: seo.canonical } : {}),
    },
    openGraph: {
      title: seo.ogTitle ?? seo.title,
      description: seo.ogDescription ?? seo.description,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage.src, alt: seo.ogImage.alt }] } : {}),
      ...openGraphLocale(locale),
    },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
