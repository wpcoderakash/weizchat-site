import type { CmsSection } from '../../cms/schema';
import { CmsCta } from './cms-link';

type Platform = Extract<CmsSection, { id: 'platform' }>;

/**
 * §5.7 — factual Cloud API education. Doubles as reassurance for Meta
 * reviewers, so the tone is educational and every statement is checkable.
 */
export function OfficialPlatform({ data }: { data: Platform }) {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <h2 className="max-w-2xl text-3xl sm:text-4xl">{data.title}</h2>
        <p className="mt-4 max-w-2xl text-lg text-muted">{data.body}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.cards.map((card) => (
            <div key={card.id} className="rounded-card border border-border bg-bg p-6">
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-muted">{card.body}</p>
            </div>
          ))}
          <div className="flex items-center rounded-card border border-dashed border-border-strong p-6">
            <CmsCta link={data.link} className="font-semibold text-accent hover:text-accent-hover" />
          </div>
        </div>
      </div>
    </section>
  );
}
