import { defineRouting } from 'next-intl/routing';

/**
 * Hebrew is the primary market and the default locale (brief §3): it lives
 * at the bare path (`/`), while `/en` and `/bn` carry prefixes. hreflang
 * alternates are emitted per page from this single source of truth.
 */
export const routing = defineRouting({
  locales: ['he', 'en', 'bn'],
  defaultLocale: 'he',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

/** Writing direction per locale — drives <html dir> and icon mirroring. */
export function directionFor(locale: string): 'rtl' | 'ltr' {
  return locale === 'he' ? 'rtl' : 'ltr';
}
