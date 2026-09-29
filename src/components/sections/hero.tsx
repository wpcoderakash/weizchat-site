import Image from 'next/image';
import type { CmsSection } from '../../cms/schema';
import { Arrow } from '../ui/arrow';
import { CmsCta } from './cms-link';

type Hero = Extract<CmsSection, { id: 'hero' }>;

/**
 * Hero (§5.2): outcome promise, plain-words subhead, register + demo CTAs.
 * The visual is a REAL screenshot of the running product (fixture data,
 * phone numbers masked) — the brief bans fake dashboards.
 *
 * Redesign 2026-09: the promise is centred and large, and the product sits
 * beneath it in a browser frame on a soft brand light. The frame settles from
 * a slight tilt as the page scrolls (`.hero-settle`, CSS scroll timeline —
 * no script). The words are the CMS's, unchanged.
 */
export function Hero({ data }: { data: Hero }) {
  return (
    <section className="glow-bg overflow-hidden">
      <div aria-hidden="true" className="grid-bg" />
      <div className="wrap pb-16 pt-16 text-center sm:pt-24 lg:pb-24">
        <h1 className="display-1 mx-auto max-w-4xl">{data.title}</h1>
        <p className="lede mx-auto mt-6 max-w-2xl">{data.sub}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <CmsCta link={data.primary} className="btn btn-primary">
            <Arrow />
          </CmsCta>
          <CmsCta link={data.secondary} className="btn btn-secondary" />
        </div>

        <div className="hero-settle mx-auto mt-14 max-w-5xl sm:mt-20">
          <div className="shot-frame text-start">
            <div aria-hidden="true" className="shot-bar">
              <span />
              <span />
              <span />
            </div>
            {/* width/height rather than a static import: the src is data. */}
            <Image
              src={data.image.src}
              alt={data.image.alt}
              width={2200}
              height={1375}
              priority
              sizes="(min-width: 1100px) 1024px, 100vw"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
