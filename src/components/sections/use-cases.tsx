'use client';

import { useState } from 'react';
import type { CmsSection } from '../../cms/schema';

type UseCases = Extract<CmsSection, { id: 'useCases' }>;

/**
 * §5.8 — use cases by department, tabbed. Concrete scenarios, no metrics.
 *
 * Redesign 2026-09: the tabs are a segmented control, and each scenario is
 * its own card that rises in when its tab is chosen. Arrow keys move between
 * tabs (the WAI-ARIA tabs pattern), in reading order — so in Hebrew the
 * right arrow goes back, as it should.
 */
export function UseCases({ data }: { data: UseCases }) {
  const [active, setActive] = useState(data.tabs[0]?.id ?? '');
  // The cards rise in only after a CHOICE: on arrival they are simply there.
  const [switched, setSwitched] = useState(false);

  function choose(id: string) {
    setActive(id);
    setSwitched(true);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = (event.key === 'ArrowRight') !== rtl;
    const index = data.tabs.findIndex((tab) => tab.id === active);
    const next = data.tabs[(index + (forward ? 1 : -1) + data.tabs.length) % data.tabs.length];
    if (!next) return;
    event.preventDefault();
    choose(next.id);
    document.getElementById(`usecase-tab-${next.id}`)?.focus();
  }

  return (
    <section className="section">
      <div className="wrap">
        <h2 data-reveal className="display-2">
          {data.title}
        </h2>

        <div
          role="tablist"
          aria-label={data.title}
          onKeyDown={onKeyDown}
          data-reveal
          className="mt-10 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1.5 shadow-[var(--shadow-sm)] [scrollbar-width:none]"
        >
          {data.tabs.map((tab) => {
            const selected = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`usecase-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`usecase-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => choose(tab.id)}
                className={
                  selected
                    ? 'shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-[0_6px_16px_-8px_var(--accent)]'
                    : 'shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:bg-accent-soft hover:text-fg'
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {data.tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`usecase-panel-${tab.id}`}
            aria-labelledby={`usecase-tab-${tab.id}`}
            hidden={active !== tab.id}
            tabIndex={0}
            className="mt-6"
          >
            <ul className="grid gap-5 md:grid-cols-3">
              {tab.points.map((point, index) => (
                <li
                  key={point}
                  style={{ animationDelay: `${index * 70}ms` }}
                  className={`card flex gap-4 p-7 ${switched ? 'motion-safe:animate-[rise_0.6s_var(--ease-out)_both]' : ''}`}
                >
                  <span aria-hidden="true" className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
                    {index + 1}
                  </span>
                  <p>{point}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
