import { useLocale } from 'next-intl';
import type { CmsSection } from '../../cms/schema';
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
}: {
  data: Pricing;
  tierNames: Record<string, string>;
  unmetered: string;
  quotaLabels: { campaigns: string; ai: string };
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
            className={`rounded-card border bg-surface p-6 ${
              tier.featured ? 'border-accent shadow-md' : 'border-border'
            }`}
          >
            <h3 className="font-semibold">{tierNames[tier.key]}</h3>
            <p className="mt-3 break-all font-mono text-3xl font-semibold">
              {tier.monthlyPrice}
              <span className="text-sm font-normal text-muted"> / {data.perMonth}</span>
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
