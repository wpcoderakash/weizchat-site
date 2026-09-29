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
    <section className="section">
      <div className="wrap">
        <h2 data-reveal className="display-2">
          {data.title}
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {data.items.map((entry, index) => (
            <figure
              key={entry.id}
              data-reveal
              style={{ '--i': index + 1 } as React.CSSProperties}
              className="card card-hover flex flex-col p-7"
            >
              <svg viewBox="0 0 24 24" width={28} height={28} aria-hidden="true" className="text-accent rtl:-scale-x-100">
                <path d="M9.5 6C6.5 7.2 5 9.6 5 13v5h5v-5H7.5c0-2 .9-3.4 2.8-4.3L9.5 6zm9 0c-3 1.2-4.5 3.6-4.5 7v5h5v-5h-2.5c0-2 .9-3.4 2.8-4.3L18.5 6z" fill="currentColor" />
              </svg>
              <blockquote className="mt-5 flex-1 text-lg">{entry.quote}</blockquote>
              <figcaption className="mt-6 border-t border-border pt-4 text-sm text-muted">
                <span className="font-semibold text-fg">{entry.author}</span> · {entry.company}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
