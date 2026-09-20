import { useLocale, useTranslations } from 'next-intl';
import type { CmsSection } from '../../cms/schema';
import { currency, plans, quoteFor } from '../../content/pricing';
import { CmsCta } from './cms-link';

type Pricing = Extract<CmsSection, { id: 'pricing' }>;

/**
 * §5.11 — pricing preview on the landing page.
 *
 * A static glance: each plan at the team size it INCLUDES, billed monthly —
 * the number a visitor can hold in their head. The interactive version (yearly
 * billing, team size) lives on /pricing, which the link below goes to.
 *
 * Plans, prices and limits come from the published catalogue snapshot
 * (`content/pricing.ts`), exactly as on /pricing, so the two can never
 * disagree. Only the wrapper copy is CMS-managed: letting an editor type a
 * price here is how a marketing page starts lying about the product.
 */
export function PricingPreview({ data, mostPopular }: { data: Pricing; mostPopular: string }) {
  const locale = useLocale();
  const t = useTranslations('pricing');
  const nf = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US');
  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl">{data.title}</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 xl:gap-6">
        {plans.map((plan) => {
          const quote = plan.pricing ? quoteFor(plan, plan.pricing.included_agents) : null;
          return (
            <div
              key={plan.id}
              className={`relative rounded-card border bg-surface p-6 lg:p-4 xl:p-6 ${
                plan.featured ? 'border-accent shadow-lg ring-1 ring-accent/25' : 'border-border'
              }`}
            >
              {plan.featured ? (
                <span className="absolute -top-3 start-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-fg">
                  {mostPopular}
                </span>
              ) : null}
              <h3 className="font-semibold">{t(`tier.${plan.id}.name`)}</h3>
              <p className="mt-3 flex items-baseline gap-1.5">
                {quote ? (
                  <>
                    <span dir="ltr" className="text-4xl font-bold tracking-tight tabular-nums lg:text-3xl xl:text-4xl">
                      {money.format(quote.monthly_cents / 100)}
                    </span>
                    <span className="text-sm text-muted">/ {data.perMonth}</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold leading-10 tracking-tight">{t('card.custom')}</span>
                )}
              </p>
              <p className="mt-3 text-sm text-muted">
                {plan.pricing
                  ? t('card.includes', { count: nf.format(plan.pricing.included_agents) })
                  : t('card.unlimitedAgents')}
              </p>
              <p className="mt-1 text-sm text-muted">
                {plan.limits.campaignMessagesPerMonth === null
                  ? t('card.unlimited')
                  : nf.format(plan.limits.campaignMessagesPerMonth)}{' '}
                · {t('limits.campaignMessagesPerMonth')}
              </p>
              <p className="mt-1 text-sm text-muted">
                {plan.limits.aiRunsPerMonth === null
                  ? t('card.unlimited')
                  : nf.format(plan.limits.aiRunsPerMonth)}{' '}
                · {t('limits.aiRunsPerMonth')}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-6 max-w-2xl text-sm text-muted">{data.metaNote}</p>
      <div className="mt-4">
        <CmsCta link={data.cta} className="inline-block font-semibold text-accent hover:text-accent-hover" />
      </div>
    </section>
  );
}
