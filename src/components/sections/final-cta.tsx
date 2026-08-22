import type { CmsSection } from '../../cms/schema';
import { CmsCta } from './cms-link';

type FinalCta = Extract<CmsSection, { id: 'finalCta' }>;

/** §5.13 — the closing ask. */
export function FinalCta({ data }: { data: FinalCta }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <div className="rounded-card bg-accent px-8 py-12 text-accent-fg lg:px-14">
        <h2 className="max-w-2xl text-3xl sm:text-4xl">{data.title}</h2>
        <p className="mt-4 max-w-xl text-lg">{data.sub}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <CmsCta
            link={data.primary}
            className="rounded-full bg-surface px-6 py-3 font-semibold text-accent hover:opacity-90"
          />
          <CmsCta
            link={data.secondary}
            className="rounded-full border border-current px-6 py-3 font-semibold hover:opacity-80"
          />
        </div>
      </div>
    </section>
  );
}
