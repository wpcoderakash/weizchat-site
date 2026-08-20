import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../../i18n/navigation';
import { site } from '../../../config/site';
import { includedInEveryPlan, pricingTiers } from '../../../content/pricing';
import { alternatesFor, openGraphLocale } from '../../../lib/seo';

/**
 * /pricing (brief §4). Tier names and limits are real product facts;
 * prices are owner-supplied placeholders. Two honesty rules the page must
 * never lose: Meta bills conversations separately, and self-serve payment
 * does not exist yet (DR-14) — so the page asks you to talk to us rather
 * than pretending there is a checkout.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: alternatesFor('/pricing'),
    openGraph: { title: t('metaTitle'), description: t('metaDescription'), ...openGraphLocale(locale) },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const nf = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US');
  const faqs = ['whoCharges', 'overQuota', 'switch', 'trial'] as const;

  return (
    <main>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <h1 className="max-w-2xl text-4xl sm:text-5xl">{t('title')}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{t('sub')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`flex flex-col rounded-card border bg-surface p-6 ${
                tier.featured ? 'border-accent shadow-md' : 'border-border'
              }`}
            >
              {tier.featured ? (
                <span className="mb-3 self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  {t('mostPopular')}
                </span>
              ) : null}
              <h2 className="text-xl font-semibold">{t(`tier.${tier.key}.name`)}</h2>
              <p className="mt-1 text-sm text-muted">{t(`tier.${tier.key}.who`)}</p>
              <p className="mt-4 font-mono text-3xl font-semibold">
                {tier.monthlyPrice}
                <span className="text-sm font-normal text-muted"> / {t('perMonth')}</span>
              </p>
              <dl className="mt-5 flex-1 space-y-3 border-t border-border pt-5 text-sm">
                <div>
                  <dt className="text-muted">{t('campaignQuota')}</dt>
                  <dd className="font-semibold">
                    {tier.campaignMessagesPerMonth === null
                      ? t('unmetered')
                      : nf.format(tier.campaignMessagesPerMonth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">{t('aiQuota')}</dt>
                  <dd className="font-semibold">
                    {tier.aiRepliesPerMonth === null
                      ? t('unmetered')
                      : nf.format(tier.aiRepliesPerMonth)}
                  </dd>
                </div>
              </dl>
              <Link
                href="/contact"
                className={`mt-6 rounded-full px-5 py-2.5 text-center font-semibold ${
                  tier.featured
                    ? 'bg-accent text-accent-fg hover:bg-accent-hover'
                    : 'border border-border-strong text-fg hover:border-accent hover:text-accent'
                }`}
              >
                {t('talkToUs')}
              </Link>
            </div>
          ))}
        </div>

        {/* Rule 0.1-adjacent honesty: Meta's fees are not ours. */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <p className="rounded-card border border-border bg-accent-soft/40 p-5 font-medium">
            {t('metaNote')}
          </p>
          <p className="rounded-card border border-border bg-surface p-5 text-muted">
            {t('paymentsNote')}
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl sm:text-3xl">{t('includedTitle')}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t('includedBody')}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {includedInEveryPlan.map((key) => (
              <li key={key} className="flex items-center gap-3 rounded-card border border-border bg-bg px-4 py-3">
                <svg viewBox="0 0 20 20" width={16} height={16} aria-hidden="true" className="shrink-0 text-ok">
                  <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-medium">{t(`included.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <h2 className="text-2xl sm:text-3xl">{t('faqTitle')}</h2>
        <dl className="mt-8 divide-y divide-border">
          {faqs.map((key) => (
            <div key={key} className="py-5">
              <dt className="font-semibold">{t(`faq.${key}.q`)}</dt>
              <dd className="mt-2 text-muted">{t(`faq.${key}.a`)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`${site.appUrl}/login`}
            className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-fg hover:bg-accent-hover"
          >
            {t('ctaTrial')}
          </a>
          <Link
            href="/contact"
            className="rounded-full border border-border-strong px-6 py-3 font-semibold text-fg hover:border-accent hover:text-accent"
          >
            {t('ctaContact')}
          </Link>
        </div>
      </section>
    </main>
  );
}
