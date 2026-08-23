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
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
        <h2 className="text-3xl sm:text-4xl">{data.title}</h2>
        <div className="mt-10 space-y-3">
          {data.items.map((item) => (
            <details
              key={item.id}
              className="group rounded-card border border-border bg-bg transition-colors open:border-accent/40"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{item.q}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="shrink-0 text-accent transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <p className="px-5 pb-5 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
