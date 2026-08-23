import { defineRouting } from 'next-intl/routing';

/**
 * URL shape (owner's decision, 2026-08-23): English is the default and
 * lives at the bare path (`/`); Hebrew sits under `/heb`.
 *
 * The locale CODE stays `he` — it is what `lang` and `hreflang` must carry
 * to be valid — while the URL SEGMENT is `heb`. next-intl's `prefixes` map
 * is exactly that distinction, so nothing downstream has to know about it.
 *
 * (The brief originally made Hebrew the unprefixed default, and Bengali was
 * dropped earlier; both were owner decisions.)
 */
export const routing = defineRouting({
  locales: ['he', 'en'],
  defaultLocale: 'en',
  localePrefix: {
    mode: 'as-needed',
    prefixes: { he: '/heb' },
  },
});

export type Locale = (typeof routing.locales)[number];

/** Writing direction per locale — drives <html dir> and icon mirroring. */
export function directionFor(locale: string): 'rtl' | 'ltr' {
  return locale === 'he' ? 'rtl' : 'ltr';
}
