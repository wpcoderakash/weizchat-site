import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../i18n/navigation';
import { site } from '../../config/site';
import { solutions, type SolutionConfig } from '../../config/solutions';
import { alternatesFor, openGraphLocale } from '../../lib/seo';
import { WaitlistCta } from './waitlist-cta';

/**
 * One template for every solution page (brief §4): independently
 * SEO-targeted, independently convertible. Normal pages close with trial +
 * demo CTAs; a comingSoon page closes with the waitlist and never shows a
 * signup CTA.
 */
export function makeSolutionPage(slug: string) {
  const config = solutions.find((s) => s.slug === slug) as SolutionConfig;
  const ns = `solutions.${config.key}`;

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: ns });
    return {
      title: t('metaTitle'),
      description: t('metaDescription'),
      alternates: alternatesFor(`/${slug}`),
      openGraph: {
        title: t('metaTitle'),
        description: t('metaDescription'),
        ...openGraphLocale(locale),
      },
    };
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: ns });
    const tc = await getTranslations({ locale, namespace: 'solutions.common' });
    const features = Array.from({ length: config.featureCount }, (_, i) => `f${i + 1}`);

    return (
      <main>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
            <p className="flex items-center gap-3 font-mono text-sm font-semibold uppercase tracking-wide text-accent">
              {t('kicker')}
              {config.comingSoon ? (
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs normal-case tracking-normal">
                  {tc('comingSoon')}
                </span>
              ) : null}
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">{t('title')}</h1>
            <p className="mt-5 max-w-2xl text-lg text-muted">{t('sub')}</p>
            {config.comingSoon ? null : (
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`${site.appUrl}/login`}
                  className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-fg hover:bg-accent-hover"
                >
                  {tc('ctaTrial')}
                </a>
                <Link
                  href="/contact"
                  className="rounded-full border border-border-strong px-6 py-3 font-semibold text-fg hover:border-accent hover:text-accent"
                >
                  {tc('ctaDemo')}
                </Link>
              </div>
            )}
          </div>
        </section>

        {config.image ? (
          <section className="mx-auto max-w-5xl px-6 pt-14">
            <div className="overflow-hidden rounded-card border border-border shadow-lg">
              {/* Real product screenshot — fixture data, masked numbers. */}
              <Image
                src={`/product/${config.image}`}
                alt={t('imageAlt')}
                width={2200}
                height={1375}
                sizes="(min-width: 1024px) 920px, 100vw"
              />
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((key) => (
              <div key={key} className="rounded-card border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold">{t(`${key}.title`)}</h2>
                <p className="mt-2 text-muted">{t(`${key}.body`)}</p>
              </div>
            ))}
          </div>
          {config.hasHonestNote ? (
            <p className="mt-8 max-w-2xl rounded-card border border-border bg-accent-soft/40 p-4 font-medium">
              {t('honest')}
            </p>
          ) : null}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          {config.comingSoon ? (
            <WaitlistCta />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-accent px-8 py-8 text-accent-fg">
              <p className="text-xl font-semibold">{tc('closerTitle')}</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${site.appUrl}/login`}
                  className="rounded-full bg-surface px-5 py-2.5 font-semibold text-accent hover:opacity-90"
                >
                  {tc('ctaTrial')}
                </a>
                <Link
                  href="/contact"
                  className="rounded-full border border-current px-5 py-2.5 font-semibold hover:opacity-80"
                >
                  {tc('ctaDemo')}
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  return { generateMetadata, Page };
}
