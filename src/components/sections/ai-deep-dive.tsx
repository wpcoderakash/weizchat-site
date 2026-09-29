import type { CmsSection } from '../../cms/schema';

type Ai = Extract<CmsSection, { id: 'ai' }>;

/**
 * The signature section (§5.6): the real Weizic flow. Steps are numbered
 * by position, so reordering them in the editor renumbers the page.
 *
 * Redesign 2026-09: the one dark "stage" on the page, so the product's
 * signature reads as the centre of it.
 */
export function AiDeepDive({ data }: { data: Ai }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="stage px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
          <p data-reveal className="font-mono text-sm font-semibold uppercase tracking-wide text-[#c4b5fd]">
            {data.kicker}
          </p>
          <h2 data-reveal className="display-2 mt-4 max-w-3xl">
            {data.title}
          </h2>

          <div className="relative mt-16">
            {/* The scroll-story track: fills as the section passes through
                the viewport (CSS view timeline — no script). Wide screens
                only; decorative. */}
            <div aria-hidden="true" className="ai-track absolute -top-7 hidden h-0.5 w-full overflow-hidden rounded-full bg-white/10 lg:block">
              <span className="ai-track-fill block h-full w-full rounded-full bg-gradient-to-r from-[#a78bfa] to-accent rtl:bg-gradient-to-l" />
            </div>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {data.steps.map((step, index) => (
              <li
                key={step.id}
                style={{ '--i': index + 1 } as React.CSSProperties}
                className="ai-step relative rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.07]"
              >
                <span className="relative flex size-11 items-center justify-center rounded-full bg-accent font-mono text-sm font-semibold text-white shadow-[0_0_0_6px_rgb(109_74_255/0.25)]">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-lg text-white">{step.title}</h3>
                <p className="muted mt-2">{step.body}</p>
              </li>
            ))}
          </ol>
          </div>

          <p
            data-reveal
            className="mt-10 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-medium text-white"
          >
            <svg viewBox="0 0 20 20" width={20} height={20} aria-hidden="true" className="mt-0.5 shrink-0 text-[#c4b5fd]">
              <path d="M10 2l6 2.5v5c0 4-2.7 7-6 8.5-3.3-1.5-6-4.5-6-8.5v-5L10 2z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M7 10l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {data.honest}
          </p>
        </div>
      </div>
    </section>
  );
}
