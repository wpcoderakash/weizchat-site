import { useLocale } from 'next-intl';
import type { CmsSection } from '../../cms/schema';
import type { PricingDoc } from '../../cms/site-schema';
import { pricingTiers } from '../../content/pricing';
import { CmsCta } from './cms-link';

type Pricing = Extract<CmsSection, { id: 'pricing' }>;

/**
 * §5.11 — pricing preview.
 *
 * The tier names and quotas stay in content/pricing.ts on purpose: they
 * mirror the product's code-owned plan matrix, and letting an editor type
 * a different quota here is how a marketing page starts lying about the
 * product. Only the wrapper copy is CMS-managed.
 */
export function PricingPreview({
  data,
  tierNames,
  unmetered,
  quotaLabels,
  prices,
  mostPopular,
}: {
  data: Pricing;
  tierNames: Record<string, string>;
  unmetered: string;
  quotaLabels: { campaigns: string; ai: string };
  prices: PricingDoc['prices'];
  mostPopular: string;
}) {
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US');

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl">{data.title}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-card border bg-surface p-6 ${
              tier.featured ? 'border-accent shadow-lg ring-1 ring-accent/25' : 'border-border'
            }`}
          >
            {tier.featured ? (
              <span className="absolute -top-3 start-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-fg">
                {mostPopular}
              </span>
            ) : null}
            <h3 className="font-semibold">{tierNames[tier.key]}</h3>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight tabular-nums">{prices[tier.id]}</span>
              <span className="text-sm text-muted">/ {data.perMonth}</span>
            </p>
            <p className="mt-3 text-sm text-muted">
              {tier.campaignMessagesPerMonth === null
                ? unmetered
                : nf.format(tier.campaignMessagesPerMonth)}{' '}
              · {quotaLabels.campaigns}
            </p>
            <p className="mt-1 text-sm text-muted">
              {tier.aiRepliesPerMonth === null ? unmetered : nf.format(tier.aiRepliesPerMonth)} ·{' '}
              {quotaLabels.ai}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-sm text-muted">{data.metaNote}</p>
      <div className="mt-4">
        <CmsCta link={data.cta} className="inline-block font-semibold text-accent hover:text-accent-hover" />
      </div>
    </section>
  );
}
