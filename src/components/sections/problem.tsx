import type { CmsSection } from '../../cms/schema';

type Problem = Extract<CmsSection, { id: 'problem' }>;

/** The problem (§5.4): three real pains, no invented numbers. */
export function Problem({ data }: { data: Problem }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="max-w-2xl text-3xl sm:text-4xl">{data.title}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {data.items.map((item) => (
          <div key={item.id} className="rounded-card border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
