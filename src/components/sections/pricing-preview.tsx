import { useLocale, useTranslations } from 'next-intl';
import type { CmsSection } from '../../cms/schema';
import { currency, plans, quoteFor } from '../../content/pricing';
import { Arrow } from '../ui/arrow';
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
    <section className="section">
      <div className="wrap">
        <h2 data-reveal className="display-2">
          {data.title}
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 xl:gap-5">
          {plans.map((plan, index) => {
            const quote = plan.pricing ? quoteFor(plan, plan.pricing.included_agents) : null;
            const featured = plan.featured;
            return (
              <div
                key={plan.id}
                data-reveal
                style={{ '--i': index + 1 } as React.CSSProperties}
                className={`card-hover relative flex flex-col p-7 lg:p-5 xl:p-7 ${
                  featured ? 'stage rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]' : 'card'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`text-lg ${featured ? 'text-white' : ''}`}>{t(`tier.${plan.id}.name`)}</h3>
                  {featured ? (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                      {mostPopular}
                    </span>
                  ) : null}
                </div>
                <p className="mt-6 flex items-baseline gap-1.5">
                  {quote ? (
                    <>
                      <span dir="ltr" className="text-4xl font-semibold tracking-tight tabular-nums lg:text-3xl xl:text-4xl">
                        {money.format(quote.monthly_cents / 100)}
                      </span>
                      <span className={`text-sm ${featured ? 'muted' : 'text-muted'}`}>/ {data.perMonth}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-semibold leading-10 tracking-tight">{t('card.custom')}</span>
                  )}
                </p>
                <ul className={`mt-6 space-y-2.5 border-t pt-5 text-sm ${featured ? 'muted border-white/10' : 'border-border text-muted'}`}>
                  <li>
                    {plan.pricing
                      ? t('card.includes', { count: nf.format(plan.pricing.included_agents) })
                      : t('card.unlimitedAgents')}
                  </li>
                  <li>
                    {plan.limits.campaignMessagesPerMonth === null
                      ? t('card.unlimited')
                      : nf.format(plan.limits.campaignMessagesPerMonth)}{' '}
                    · {t('limits.campaignMessagesPerMonth')}
                  </li>
                  <li>
                    {plan.limits.aiRunsPerMonth === null
                      ? t('card.unlimited')
                      : nf.format(plan.limits.aiRunsPerMonth)}{' '}
                    · {t('limits.aiRunsPerMonth')}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
        <div data-reveal className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm text-muted">{data.metaNote}</p>
          <CmsCta link={data.cta} className="link-arrow shrink-0">
            <Arrow />
          </CmsCta>
        </div>
      </div>
    </section>
  );
}
