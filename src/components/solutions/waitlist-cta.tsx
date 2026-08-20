'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { site } from '../../config/site';

/**
 * The campaigns waitlist (brief §4). The marketing site has no backend, so
 * the honest mechanism is a prefilled email — the button says so. No data
 * is stored here.
 */
export function WaitlistCta() {
  const t = useTranslations('solutions.common');
  const [email, setEmail] = useState('');

  const href = `mailto:${site.supportEmail}?subject=${encodeURIComponent(
    t('waitlistSubject'),
  )}&body=${encodeURIComponent(t('waitlistEmailBody', { email: email || '—' }))}`;

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold">{t('waitlistTitle')}</h2>
      <p className="mt-2 text-muted">{t('waitlistBody')}</p>
      <form
        className="mt-4 flex flex-wrap items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          window.location.href = href;
        }}
      >
        <label className="sr-only" htmlFor="waitlist-email">
          {t('waitlistEmailLabel')}
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('waitlistEmailLabel')}
          className="w-full max-w-xs rounded-full border border-border-strong bg-bg px-4 py-2.5 focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover"
        >
          {t('waitlistCta')}
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">{t('waitlistNote')}</p>
    </div>
  );
}
