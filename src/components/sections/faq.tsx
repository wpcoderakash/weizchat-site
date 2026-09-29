import type { CmsSection } from '../../cms/schema';

type Faq = Extract<CmsSection, { id: 'faq' }>;

/**
 * §5.12 — FAQ as an accordion, with FAQPage JSON-LD. Native
 * details/summary: keyboard and screen-reader behavior for free, no JS,
 * and the flex row flips correctly in RTL. The structured data is
 * generated from the same array the page renders, so an editor adding a
 * question adds it to both and the two can never disagree.
 */
export function Faq({ data }: { data: Faq }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <section className="section border-y border-border bg-surface">
      <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <h2 data-reveal className="display-2 lg:sticky lg:top-28 lg:self-start">
          {data.title}
        </h2>
        <div data-reveal className="border-t border-border">
          {data.items.map((item) => (
            <details key={item.id} className="faq-item group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center gap-6 py-6 text-lg font-medium transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{item.q}</span>
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-border-strong text-accent transition-[transform,background-color,border-color] duration-300 group-open:rotate-45 group-open:border-accent group-open:bg-accent-soft"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M7 1.5v11M1.5 7h11" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-7 pe-14 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
