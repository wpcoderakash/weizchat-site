import type { CmsSection } from '../../cms/schema';

type Problem = Extract<CmsSection, { id: 'problem' }>;

/**
 * The problem (§5.4): three real pains, no invented numbers. The index
 * (01, 02, 03) is position, not data — reordering in the editor renumbers.
 */
export function Problem({ data }: { data: Problem }) {
  return (
    <section className="section">
      <div className="wrap">
        <h2 data-reveal className="display-2 max-w-3xl">
          {data.title}
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {data.items.map((item, index) => (
            <div
              key={item.id}
              data-reveal
              style={{ '--i': index + 1 } as React.CSSProperties}
              className="card card-hover flex flex-col p-7"
            >
              <span aria-hidden="true" className="font-mono text-sm font-semibold text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 text-xl">{item.title}</h3>
              <p className="mt-3 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
