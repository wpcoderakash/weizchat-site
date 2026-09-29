import type { CmsSection } from '../../cms/schema';
import { Arrow } from '../ui/arrow';
import { CmsCta } from './cms-link';

type FinalCta = Extract<CmsSection, { id: 'finalCta' }>;

/**
 * §5.13 — the closing ask. The accent panel keeps the brand colour and
 * gains two slow-drifting lights (`.cta-panel`, still under reduced motion).
 */
export function FinalCta({ data }: { data: FinalCta }) {
  return (
    <section className="section">
      <div className="wrap">
        <div data-reveal className="cta-panel px-6 py-16 text-center sm:px-12 lg:py-24">
          <h2 className="display-2 mx-auto max-w-3xl">{data.title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">{data.sub}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <CmsCta link={data.primary} className="btn btn-light">
              <Arrow />
            </CmsCta>
            <CmsCta link={data.secondary} className="btn btn-outline-light" />
          </div>
        </div>
      </div>
    </section>
  );
}
