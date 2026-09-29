'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { CmsSection } from '../../cms/schema';
import { Link } from '../../i18n/navigation';
import { Arrow } from '../ui/arrow';

type Pillars = Extract<CmsSection, { id: 'pillars' }>;

/** The three glyphs a pillar may use. Named in content, drawn here. */
const ICONS: Record<'inbox' | 'ai' | 'bot', React.ReactNode> = {
  inbox: (
    <path d="M3 12l3-7h12l3 7v7H3v-7zm0 0h5l2 3h4l2-3h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  ),
  ai: (
    <path d="M12 3l2.2 6.8H21l-5.4 4 2 6.9-5.6-4.2-5.6 4.2 2-6.9L3 9.8h6.8L12 3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  ),
  bot: (
    <path d="M12 4v3m-6 3a6 6 0 0112 0v6H6v-6zm3 3h.01M15 13h.01M9 20h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  ),
};

/**
 * Three pillars (§5.5) as a product showcase (redesign pass 2).
 *
 * Choosing a pillar shows the REAL screenshot from that pillar's own
 * solution page (`previews`, keyed by the pillar's link — loaded on the
 * server from the CMS). Nothing here is drawn for the home page, so the
 * preview can never show a product that does not exist. A pillar whose page
 * has no screenshot keeps its text and shows none.
 *
 * WAI-ARIA tabs: arrow keys move through the list (left/right follow reading
 * order, so they mirror in Hebrew), and the "learn more" link sits in the
 * panel, never inside a tab button.
 */
export function Pillars({
  data,
  previews,
}: {
  data: Pillars;
  previews: Record<string, { src: string; alt: string }>;
}) {
  const [active, setActive] = useState(data.items[0]?.id ?? '');
  const current = data.items.find((item) => item.id === active) ?? data.items[0];
  const withImage = data.items.filter((item) => previews[item.href]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    let step = 0;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    if (event.key === 'ArrowDown') step = 1;
    else if (event.key === 'ArrowUp') step = -1;
    else if (event.key === 'ArrowRight') step = rtl ? -1 : 1;
    else if (event.key === 'ArrowLeft') step = rtl ? 1 : -1;
    if (step === 0) return;
    const index = data.items.findIndex((item) => item.id === current?.id);
    const next = data.items[(index + step + data.items.length) % data.items.length];
    if (!next) return;
    event.preventDefault();
    setActive(next.id);
    document.getElementById(`pillar-tab-${next.id}`)?.focus();
  }

  return (
    <section className="section border-y border-border bg-surface">
      <div className="wrap">
        <h2 data-reveal className="display-2 max-w-3xl">
          {data.title}
        </h2>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label={data.title}
            onKeyDown={onKeyDown}
            className="grid gap-3"
          >
            {data.items.map((item, index) => {
              const selected = item.id === current?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`pillar-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls="pillar-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(item.id)}
                  data-reveal
                  style={{ '--i': index + 1 } as React.CSSProperties}
                  className={`relative flex gap-4 overflow-hidden rounded-[var(--radius-lg)] border p-5 text-start transition-[background-color,border-color,box-shadow] duration-300 sm:p-6 ${
                    selected
                      ? 'border-accent/40 bg-bg shadow-[var(--shadow-md)]'
                      : 'border-transparent hover:border-border hover:bg-bg/60'
                  }`}
                >
                  {/* The chosen tab's edge: a bar on the reading-start side. */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-5 start-0 w-1 rounded-full bg-accent transition-opacity duration-300 ${
                      selected ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span className="icon-tile shrink-0">
                    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
                      {ICONS[item.icon]}
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-semibold">{item.title}</span>
                    <span className="mt-1.5 block text-muted">{item.body}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="pillar-panel"
            aria-labelledby={current ? `pillar-tab-${current.id}` : undefined}
            data-reveal
            style={{ '--i': 2 } as React.CSSProperties}
            className="lg:sticky lg:top-28"
          >
            {withImage.length > 0 ? (
              <div className="shot-frame">
                <div aria-hidden="true" className="shot-bar">
                  <span />
                  <span />
                  <span />
                </div>
                {/* Every screenshot is in the page, stacked; the chosen one is
                    shown. Crossfading needs them all in the DOM — the hidden
                    ones are taken out of the accessibility tree. */}
                <div className="relative aspect-[16/10] bg-surface-2">
                  {withImage.map((item) => {
                    const shot = previews[item.href]!;
                    const shown = item.id === current?.id;
                    return (
                      <Image
                        key={item.id}
                        src={shot.src}
                        alt={shown ? shot.alt : ''}
                        aria-hidden={shown ? undefined : true}
                        fill
                        sizes="(min-width: 1024px) 700px, 100vw"
                        className={`object-cover object-top transition-[opacity,transform] duration-500 ease-[var(--ease-out)] ${
                          shown ? 'scale-100 opacity-100' : 'scale-[1.02] opacity-0'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
            {current ? (
              <Link href={current.href} className="link-arrow mt-6">
                {data.linkLabel}
                <span className="sr-only"> — {current.title}</span>
                <Arrow />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
