import type { CmsSection } from '../../cms/schema';

type Faq = Extract<CmsSection, { id: 'faq' }>;

/**
 * §5.12 — FAQ with FAQPage JSON-LD. The structured data is generated from
 * the same array the page renders, so an editor adding a question adds it
 * to both and the two can never disagree.
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
        <dl className="mt-10 divide-y divide-border">
          {data.items.map((item) => (
            <div key={item.id} className="py-5">
              <dt className="text-lg font-semibold">{item.q}</dt>
              <dd className="mt-2 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
