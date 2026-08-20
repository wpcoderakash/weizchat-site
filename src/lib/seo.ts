import type { Metadata } from 'next';

/**
 * hreflang + og:locale plumbing (brief SECTION 3): every page declares its
 * alternates in all three locales. `he` lives unprefixed at the root.
 */
const OG_LOCALES: Record<string, string> = { he: 'he_IL', en: 'en_US' };

export function alternatesFor(path: string): Metadata['alternates'] {
  const clean = path === '/' ? '' : path;
  return {
    languages: {
      he: clean || '/',
      en: `/en${clean}`,
      'x-default': clean || '/',
    },
  };
}

export function openGraphLocale(locale: string) {
  return {
    locale: OG_LOCALES[locale] ?? 'he_IL',
    alternateLocale: Object.entries(OG_LOCALES)
      .filter(([key]) => key !== locale)
      .map(([, value]) => value),
  };
}
