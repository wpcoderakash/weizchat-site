import Image from 'next/image';
import type { CmsSection } from '../../cms/schema';
import { CmsCta } from './cms-link';

type Hero = Extract<CmsSection, { id: 'hero' }>;

/**
 * Hero (§5.2): outcome promise, plain-words subhead, trial + demo CTAs.
 * The visual is a REAL screenshot of the running product (fixture data,
 * phone numbers masked) — the brief bans fake dashboards. Markup is
 * unchanged from the hand-written version; only the source of the words
 * moved (ADR-0032).
 */
export function Hero({ data }: { data: Hero }) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="text-4xl sm:text-5xl">{data.title}</h1>
          <p className="mt-5 max-w-lg text-lg text-muted">{data.sub}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CmsCta
              link={data.primary}
              className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-fg hover:bg-accent-hover"
            />
            <CmsCta
              link={data.secondary}
              className="rounded-full border border-border-strong px-6 py-3 font-semibold text-fg hover:border-accent hover:text-accent"
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-card border border-border shadow-lg">
          {/* width/height rather than a static import: the src is now data. */}
          <Image
            src={data.image.src}
            alt={data.image.alt}
            width={2200}
            height={1375}
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
