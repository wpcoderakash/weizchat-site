'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const TABS = ['service', 'sales', 'marketing'] as const;
type Tab = (typeof TABS)[number];

/** §5.8 — use cases by department, tabbed. Concrete scenarios, no metrics. */
export function UseCases() {
  const t = useTranslations('home.useCases');
  const [active, setActive] = useState<Tab>('service');

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl">{t('title')}</h2>

      <div role="tablist" aria-label={t('title')} className="mt-8 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            id={`usecase-tab-${tab}`}
            aria-selected={active === tab}
            aria-controls={`usecase-panel-${tab}`}
            onClick={() => setActive(tab)}
            className={
              active === tab
                ? 'rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-fg'
                : 'rounded-full border border-border-strong px-5 py-2 text-sm font-semibold text-muted hover:text-fg'
            }
          >
            {t(`${tab}.label`)}
          </button>
        ))}
      </div>

      {TABS.map((tab) => (
        <div
          key={tab}
          role="tabpanel"
          id={`usecase-panel-${tab}`}
          aria-labelledby={`usecase-tab-${tab}`}
          hidden={active !== tab}
          className="mt-6 rounded-card border border-border bg-surface p-6"
        >
          <ul className="grid gap-4 md:grid-cols-3">
            {(['a', 'b', 'c'] as const).map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <p className="text-muted">{t(`${tab}.${item}`)}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
