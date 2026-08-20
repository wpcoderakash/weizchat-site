import { useTranslations } from 'next-intl';

const QUESTIONS = ['waba', 'charges', 'keepNumber', 'data', 'aiSafety'] as const;

/**
 * §5.12 — FAQ with FAQPage JSON-LD. The four Meta-relevant questions are
 * mandated by the brief; the fifth answers the objection we hear most.
 */
export function Faq() {
  const t = useTranslations('home.faq');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: QUESTIONS.map((key) => ({
      '@type': 'Question',
      name: t(`${key}.q`),
      acceptedAnswer: { '@type': 'Answer', text: t(`${key}.a`) },
    })),
  };

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
        <h2 className="text-3xl sm:text-4xl">{t('title')}</h2>
        <dl className="mt-10 divide-y divide-border">
          {QUESTIONS.map((key) => (
            <div key={key} className="py-5">
              <dt className="text-lg font-semibold">{t(`${key}.q`)}</dt>
              <dd className="mt-2 text-muted">{t(`${key}.a`)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
