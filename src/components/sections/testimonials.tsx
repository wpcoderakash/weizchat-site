import type { CmsSection } from '../../cms/schema';

type Testimonials = Extract<CmsSection, { id: 'testimonials' }>;

/**
 * §5.10 — data-driven testimonials. The schema makes `consentOnFile: true`
 * a literal, so an entry without written consent cannot be saved; an empty
 * list renders NOTHING. An empty wall of praise is worse than none.
 */
export function Testimonials({ data }: { data: Testimonials }) {
  if (data.items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl">{data.title}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {data.items.map((entry) => (
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
