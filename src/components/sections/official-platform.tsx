import type { CmsSection } from '../../cms/schema';
import { Arrow } from '../ui/arrow';
import { CmsCta } from './cms-link';

type Platform = Extract<CmsSection, { id: 'platform' }>;

/**
 * §5.7 — factual Cloud API education. Doubles as reassurance for Meta
 * reviewers, so the tone is educational and every statement is checkable.
 * The information-center link closes the grid as its own card.
 */
export function OfficialPlatform({ data }: { data: Platform }) {
  return (
    <section className="section border-y border-border bg-surface">
      <div className="wrap">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 data-reveal className="display-2 max-w-xl">
            {data.title}
          </h2>
          <p data-reveal className="lede max-w-xl">
            {data.body}
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.cards.map((card, index) => (
            <div
              key={card.id}
              data-reveal
              style={{ '--i': (index % 3) + 1 } as React.CSSProperties}
              className="card card-hover bg-bg p-7"
            >
              <span aria-hidden="true" className="block size-2 rounded-full bg-accent shadow-[0_0_0_5px_var(--accent-soft)]" />
              <h3 className="mt-5 text-lg">{card.title}</h3>
              <p className="mt-2 text-muted">{card.body}</p>
            </div>
          ))}
          <div
            data-reveal
            style={{ '--i': 3 } as React.CSSProperties}
            className="card-hover flex items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong p-7"
          >
            <CmsCta link={data.link} className="link-arrow text-lg">
              <Arrow size={16} />
            </CmsCta>
          </div>
        </div>
      </div>
    </section>
  );
}
