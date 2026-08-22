'use client';

import { useState } from 'react';
import type { CmsSection } from '../../cms/schema';

type UseCases = Extract<CmsSection, { id: 'useCases' }>;

/** §5.8 — use cases by department, tabbed. Concrete scenarios, no metrics. */
export function UseCases({ data }: { data: UseCases }) {
  const [active, setActive] = useState(data.tabs[0]?.id ?? '');

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl">{data.title}</h2>

      <div role="tablist" aria-label={data.title} className="mt-8 flex flex-wrap gap-2">
        {data.tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`usecase-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`usecase-panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={
              active === tab.id
                ? 'rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-fg'
                : 'rounded-full border border-border-strong px-5 py-2 text-sm font-semibold text-muted hover:text-fg'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {data.tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`usecase-panel-${tab.id}`}
          aria-labelledby={`usecase-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="mt-6 rounded-card border border-border bg-surface p-6"
        >
          <ul className="grid gap-4 md:grid-cols-3">
            {tab.points.map((point) => (
              <li key={point} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <p className="text-muted">{point}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
