'use client';

import { useLocale, useTranslations } from 'next-intl';
import { routing } from '../../i18n/routing';
import { Link, usePathname } from '../../i18n/navigation';

const NATIVE_NAMES: Record<string, string> = { he: 'עברית', en: 'English' };

/**
 * Switches locale while staying on the same page. Native names on purpose:
 * a reader hunting for their language recognises it in their own script.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav aria-label={t('languageSwitcher')} className="flex items-center gap-1 text-sm">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          aria-current={l === locale ? 'true' : undefined}
          className={
            l === locale
              ? 'rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent'
              : 'rounded-full px-2.5 py-1 text-muted hover:text-fg'
          }
        >
          {NATIVE_NAMES[l]}
        </Link>
      ))}
    </nav>
  );
}
