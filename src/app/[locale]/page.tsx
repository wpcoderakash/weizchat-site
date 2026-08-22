import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getLandingPage } from '../../cms/store';
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
import { alternatesFor, openGraphLocale } from '../../lib/seo';

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
  const { seo } = getLandingPage(locale);
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      ...alternatesFor('/'),
      ...(seo.canonical ? { canonical: seo.canonical } : {}),
    },
    openGraph: {
      title: seo.ogTitle ?? seo.title,
      description: seo.ogDescription ?? seo.description,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage.src, alt: seo.ogImage.alt }] } : {}),
      ...openGraphLocale(locale),
    },
  };
}

/** Renders whichever section this is. Unknown ids are skipped, not crashed on. */
function renderSection(
  section: CmsSection,
  extras: { tierNames: Record<string, string>; unmetered: string; quotaLabels: { campaigns: string; ai: string } },
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
      return <Pillars key={section.id} data={section} />;
    case 'ai':
      return <AiDeepDive key={section.id} data={section} />;
    case 'platform':
      return <OfficialPlatform key={section.id} data={section} />;
    case 'useCases':
      return <UseCases key={section.id} data={section} />;
    case 'crm':
      return <SimpleCrm key={section.id} data={section} />;
    case 'testimonials':
      return <Testimonials key={section.id} data={section} />;
    case 'pricing':
      return <PricingPreview key={section.id} data={section} {...extras} />;
    case 'faq':
      return <Faq key={section.id} data={section} />;
    case 'finalCta':
      return <FinalCta key={section.id} data={section} />;
    default:
      return null;
  }
}

export async function LandingSections({ page, locale }: { page: LandingPage; locale: string }) {
  // Plan names and quota labels stay in the product's own vocabulary, not
  // the CMS: they mirror the code-owned plan matrix.
  const tp = await getTranslations({ locale, namespace: 'pricing' });
  const extras = {
    tierNames: { free: tp('tier.free.name'), pro: tp('tier.pro.name'), unlimited: tp('tier.unlimited.name') },
    unmetered: tp('unmetered'),
    quotaLabels: { campaigns: tp('campaignQuota'), ai: tp('aiQuota') },
  };
  return <>{page.sections.map((section) => renderSection(section, extras))}</>;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = getLandingPage(locale);

  return (
    <main>
      <LandingSections page={page} locale={locale} />
    </main>
  );
}
