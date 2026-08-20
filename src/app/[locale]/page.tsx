import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { TrustStrip } from '../../components/layout/trust-strip';
import { Hero } from '../../components/sections/hero';
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

/** The home page, in the §5 order. Nav and Footer come from the layout. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: alternatesFor('/'),
    openGraph: { title: t('title'), description: t('description'), ...openGraphLocale(locale) },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <TrustStrip />
      <Problem />
      <Pillars />
      <AiDeepDive />
      <OfficialPlatform />
      <UseCases />
      <SimpleCrm />
      <Testimonials />
      <PricingPreview />
      <Faq />
      <FinalCta />
    </main>
  );
}
