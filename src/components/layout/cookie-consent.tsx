'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { readConsent, writeConsent, type ConsentChoice } from '../../lib/consent';

// localStorage never notifies; the banner re-renders via `dismissed` instead.
const emptySubscribe = () => () => {};

/**
 * Cookie banner (brief 0.5.5). Honest by construction: the site sets only
 * essential state today, and anything non-essential added later must check
 * `hasAnalyticsConsent()` first. Renders nothing until mounted so the
 * server HTML never flashes a banner at returning visitors.
 */
export function CookieConsent() {
  const t = useTranslations('cookies');
  // Server snapshot says 'server' so SSR/hydration never flash the banner;
  // the real stored choice is only read on the client.
  const stored = useSyncExternalStore(emptySubscribe, readConsent, () => 'server' as const);
  const [dismissed, setDismissed] = useState(false);

  if (stored === 'server' || stored !== null || dismissed) return null;

  const choose = (choice: ConsentChoice) => {
    writeConsent(choice);
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label={t('label')}
      className="fixed bottom-4 start-4 end-4 z-50 max-w-xl rounded-card border border-border bg-surface p-4 shadow-lg sm:start-6 sm:end-auto sm:w-full"
    >
      <p className="text-sm text-fg">{t('body')}</p>
      <p className="mt-1 text-sm">
        <Link href="/privacy-policy" className="text-accent underline hover:text-accent-hover">
          {t('policyLink')}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choose('accepted')}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
        >
          {t('accept')}
        </button>
        <button
          type="button"
          onClick={() => choose('declined')}
          className="rounded-full border border-border-strong px-4 py-1.5 text-sm font-semibold text-fg hover:border-accent"
        >
          {t('decline')}
        </button>
      </div>
    </div>
  );
}
