import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../../i18n/navigation';
import { pricingTiers } from '../../../content/pricing';
import { getPageDoc } from '../../../cms/load';
import type { PricingDoc } from '../../../cms/site-schema';
import { CmsCta } from '../../../components/sections/cms-link';
import { metaFromSeo } from '../../../lib/seo';

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
  const doc = await getPageDoc<PricingDoc>('pricing', locale);
  return metaFromSeo(doc.seo, '/pricing', locale);
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = await getPageDoc<PricingDoc>('pricing', locale);
  // Tier NAMES stay in the product's own vocabulary (ADR-0032) — they
  // mirror the code-owned plan matrix, so they are not CMS content.
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const nf = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US');

  return (
    <main>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <h1 className="max-w-2xl text-4xl sm:text-5xl">{doc.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{doc.sub}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`flex flex-col rounded-card border bg-surface p-6 ${
                tier.featured ? 'border-accent shadow-lg ring-1 ring-accent/25' : 'border-border'
              }`}
            >
              {tier.featured ? (
                <span className="mb-3 self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  {doc.mostPopular}
                </span>
              ) : null}
              <h2 className="text-xl font-semibold">{t(`tier.${tier.key}.name`)}</h2>
              <p className="mt-1 text-sm text-muted">{t(`tier.${tier.key}.who`)}</p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight tabular-nums">
                  {doc.prices[tier.id]}
                </span>
                <span className="text-sm text-muted">/ {doc.perMonth}</span>
              </p>
              <dl className="mt-5 flex-1 space-y-3 border-t border-border pt-5 text-sm">
                <div>
                  <dt className="text-muted">{doc.campaignQuota}</dt>
                  <dd className="font-semibold">
                    {tier.campaignMessagesPerMonth === null
                      ? doc.unmetered
                      : nf.format(tier.campaignMessagesPerMonth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">{doc.aiQuota}</dt>
                  <dd className="font-semibold">
                    {tier.aiRepliesPerMonth === null
                      ? doc.unmetered
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
                {doc.talkToUs}
              </Link>
            </div>
          ))}
        </div>

        {/* Rule 0.1-adjacent honesty: Meta's fees are not ours. */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <p className="rounded-card border border-border bg-accent-soft/40 p-5 font-medium">
            {doc.metaNote}
          </p>
          <p className="rounded-card border border-border bg-surface p-5 text-muted">
            {doc.paymentsNote}
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl sm:text-3xl">{doc.includedTitle}</h2>
          <p className="mt-3 max-w-2xl text-muted">{doc.includedBody}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {doc.included.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-card border border-border bg-bg px-4 py-3">
                <svg viewBox="0 0 20 20" width={16} height={16} aria-hidden="true" className="shrink-0 text-ok">
                  <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <h2 className="text-2xl sm:text-3xl">{doc.faqTitle}</h2>
        <dl className="mt-8 divide-y divide-border">
          {doc.faq.map((item) => (
            <div key={item.id} className="py-5">
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-2 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <CmsCta
            link={doc.ctaTrial}
            className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-fg hover:bg-accent-hover"
          />
          <CmsCta
            link={doc.ctaContact}
            className="rounded-full border border-border-strong px-6 py-3 font-semibold text-fg hover:border-accent hover:text-accent"
          />
        </div>
      </section>
    </main>
  );
}
