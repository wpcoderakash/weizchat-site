import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getPageDoc } from '../../cms/load';
import type { PricingDoc, SolutionDoc } from '../../cms/site-schema';
import { pageBySlug } from '../../cms/registry';
import type { CmsSection, LandingPage } from '../../cms/schema';
import { Hero } from '../../components/sections/hero';
import { TrustStrip } from '../../components/sections/trust-strip';
import { Problem } from '../../components/sections/problem';
import { Pillars } from '../../components/sections/pillars';
import { AiDeepDive } from '../../components/sections/ai-deep-dive';
import { OfficialPlatform } from '../../components/sections/official-platform';
import { UseCases } from '../../components/sections/use-cases';
import { SimpleCrm } from '../../components/sections/simple-crm';
import { Testimonials } from '../../components/sections/testimonials';
import { PricingPreview } from '../../components/sections/pricing-preview';
import { Faq } from '../../components/sections/faq';
import { FinalCta } from '../../components/sections/final-cta';
import { metaFromSeo } from '../../lib/seo';

/**
 * The home page (ADR-0032).
 *
 * Content comes from the CMS store on the server — one filesystem read at
 * render, no client fetch, so the page stays as fast and as SEO-friendly
 * as when the copy was hard-coded. The array's order IS the page's order,
 * and a section with `visible: false` is not rendered at all.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { seo } = await getPageDoc<LandingPage>('home', locale);
  return metaFromSeo(seo, '/', locale);
}

/** Renders whichever section this is. Unknown ids are skipped, not crashed on. */
function renderSection(
  section: CmsSection,
  extras: {
    mostPopular: string;
    previews: Previews;
  },
) {
  if (!section.visible) return null;
  switch (section.id) {
    case 'hero':
      return <Hero key={section.id} data={section} />;
    case 'trust':
      return <TrustStrip key={section.id} data={section} />;
    case 'problem':
      return <Problem key={section.id} data={section} />;
    case 'pillars':
      return <Pillars key={section.id} data={section} previews={extras.previews} />;
    case 'ai':
      return <AiDeepDive key={section.id} data={section} />;
    case 'platform':
      return <OfficialPlatform key={section.id} data={section} />;
    case 'useCases':
      return <UseCases key={section.id} data={section} />;
    case 'crm':
      return <SimpleCrm key={section.id} data={section} preview={extras.previews[section.link.href] ?? null} />;
    case 'testimonials':
      return <Testimonials key={section.id} data={section} />;
    case 'pricing':
      return <PricingPreview key={section.id} data={section} mostPopular={extras.mostPopular} />;
    case 'faq':
      return <Faq key={section.id} data={section} />;
    case 'finalCta':
      return <FinalCta key={section.id} data={section} />;
    default:
      return null;
  }
}

/** href → the real product screenshot on that solution page. */
type Previews = Record<string, { src: string; alt: string }>;

/**
 * The product previews on the home page are the SOLUTION PAGES' own
 * screenshots, looked up by the link a section already carries. Nothing is
 * drawn for the home page: a pillar whose page has no screenshot (or is
 * coming soon) simply shows none. An unknown slug is skipped, not thrown.
 */
async function loadPreviews(page: LandingPage, locale: string): Promise<Previews> {
  const hrefs = new Set<string>();
  for (const section of page.sections) {
    if (section.id === 'pillars') for (const item of section.items) hrefs.add(item.href);
    if (section.id === 'crm') hrefs.add(section.link.href);
  }
  const previews: Previews = {};
  await Promise.all(
    [...hrefs].map(async (href) => {
      const slug = href.replace(/^\//, '');
      if (!/^[a-z-]+$/.test(slug) || !pageBySlug(slug)) return;
      const doc = await getPageDoc<SolutionDoc>(slug, locale).catch(() => null);
      if (doc?.image && !doc.comingSoon) previews[href] = doc.image;
    }),
  );
  return previews;
}

export async function LandingSections({ page, locale }: { page: LandingPage; locale: string }) {
  // The badge is wrapper copy from the pricing DOCUMENT; plans, prices and
  // limits come from the published catalogue inside the preview itself.
  const pricingDoc = await getPageDoc<PricingDoc>('pricing', locale);
  const extras = { mostPopular: pricingDoc.mostPopular, previews: await loadPreviews(page, locale) };
  return <>{page.sections.map((section) => renderSection(section, extras))}</>;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await getPageDoc<LandingPage>('home', locale);

  return (
    <main>
      <LandingSections page={page} locale={locale} />
    </main>
  );
}
