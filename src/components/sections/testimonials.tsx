import { useLocale, useTranslations } from 'next-intl';
import { publishedTestimonials } from '../../content/testimonials';

/**
 * §5.10 — data-driven testimonials. The content file only publishes entries
 * with written consent on file; while it is empty this section renders
 * NOTHING — an empty wall of praise is worse than none.
 */
export function Testimonials() {
  const locale = useLocale();
  const t = useTranslations('home.testimonials');
  const entries = publishedTestimonials(locale);

  if (entries.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl">{t('title')}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {entries.map((entry) => (
          <figure key={entry.id} className="rounded-card border border-border bg-surface p-6">
            <blockquote className="text-lg">{entry.quote}</blockquote>
            <figcaption className="mt-4 text-sm text-muted">
              {entry.author} · {entry.company}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
