import type { CmsSection } from '../../cms/schema';

type Ai = Extract<CmsSection, { id: 'ai' }>;

/**
 * The signature section (§5.6): the real Weizic flow. Steps are numbered
 * by position, so reordering them in the editor renumbers the page.
 */
export function AiDeepDive({ data }: { data: Ai }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <p className="font-mono text-sm font-semibold uppercase tracking-wide text-accent">
        {data.kicker}
      </p>
      <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">{data.title}</h2>

      <div className="relative mt-12">
        {/* The Bolt Path — the W's zigzag connecting the steps. */}
        <svg
          aria-hidden="true"
          className="absolute inset-x-0 top-10 hidden h-8 w-full text-accent-soft lg:block"
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
        >
          <polyline points="0,30 190,10 380,30 570,10 760,30 1000,10" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
        <ol className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {data.steps.map((step, index) => (
            <li key={step.id} className="rounded-card border border-border bg-surface p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent font-mono text-sm font-semibold text-accent-fg">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-8 max-w-2xl rounded-card border border-border bg-accent-soft/40 p-4 font-medium">
        {data.honest}
      </p>
    </section>
  );
}
