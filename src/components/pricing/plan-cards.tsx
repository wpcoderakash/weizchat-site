'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import {
  METERED_LIMITS,
  annualDiscountPercent,
  cheapestPlanFor,
  currency,
  maxSelectableAgents,
  perMonthCents,
  plans,
  quoteFor,
  type BillingPeriod,
  type Plan,
} from '../../content/pricing';

/**
 * The plan cards, with the two controls that move their prices.
 *
 * Every number on a card is READ from the published price table
 * (`content/pricing.ts` → `plan-catalogue.json`). Changing the billing period
 * or the team size changes which row is read; nothing here adds, multiplies
 * or discounts. That is the whole point of the design — see the comment at
 * the top of `content/pricing.ts`.
 */

const DEFAULT_AGENTS = 3;

/** "$39", "$47.20" — cents shown only when there are any. Always LTR. */
function money(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

/**
 * An absolute href leaves the site (the app's registration); a relative one
 * stays inside the locale-aware router, so Hebrew keeps its `/heb` prefix.
 */
function CardLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  return /^https?:\/\//i.test(href) ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function PlanCards({
  mostPopular,
  getStartedHref,
  contactHref,
  locale,
}: {
  mostPopular: string;
  /** Where a priced plan's button goes — CMS-configurable (registration today). */
  getStartedHref: string;
  contactHref: string;
  locale: string;
}) {
  const t = useTranslations('pricing');
  // Monthly first: the number a visitor meets is the list price — the same one
  // the landing page shows — and the toggle offers the saving. Opening on the
  // discounted figure would make the first price on the page the one fewest
  // people pay.
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [typed, setTyped] = useState(String(DEFAULT_AGENTS));
  const nf = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US');

  const clamp = (n: number) => Math.min(maxSelectableAgents, Math.max(1, Math.round(n)));
  const commit = (n: number) => {
    const next = clamp(n);
    setAgents(next);
    setTyped(String(next));
  };

  const cheapest = cheapestPlanFor(agents, period);
  /** The first plan, in catalogue order, that can seat this team. */
  const firstThatFits = (after: Plan): Plan | undefined =>
    plans.slice(plans.indexOf(after) + 1).find((p) => !p.pricing || quoteFor(p, agents));

  return (
    <div>
      {/* ── controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-5 md:flex-row md:items-end md:justify-between">
        <fieldset>
          <legend className="text-sm font-medium text-muted">{t('billing.label')}</legend>
          <div className="mt-2 inline-flex rounded-full border border-border-strong p-1">
            {(['monthly', 'yearly'] as const).map((p) => (
              <label
                key={p}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  period === p ? 'bg-accent text-accent-fg' : 'text-fg hover:text-accent'
                }`}
              >
                <input
                  type="radio"
                  name="billing-period"
                  value={p}
                  checked={period === p}
                  onChange={() => setPeriod(p)}
                  className="sr-only"
                />
                {t(`billing.${p}`)}
                {p === 'yearly' ? (
                  <span
                    className={`ms-2 rounded-full px-2 py-0.5 text-xs ${
                      period === p ? 'bg-accent-fg/20' : 'bg-accent-soft text-accent'
                    }`}
                  >
                    {t('billing.save', { percent: annualDiscountPercent })}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="pricing-agents" className="text-sm font-medium text-muted">
            {t('agents.label')}
          </label>
          {/* Numbers read left to right in Hebrew too, so the stepper keeps
              minus on the left and plus on the right in both directions. */}
          <div dir="ltr" className="mt-2 flex items-center gap-2 rtl:justify-end">
            <button
              type="button"
              onClick={() => commit(agents - 1)}
              disabled={agents <= 1}
              aria-label={t('agents.decrease')}
              className="h-10 w-10 rounded-full border border-border-strong text-lg font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">−</span>
            </button>
            <input
              id="pricing-agents"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxSelectableAgents}
              step={1}
              value={typed}
              aria-describedby="pricing-agents-hint"
              onChange={(e) => {
                setTyped(e.target.value);
                const n = Number(e.target.value);
                // Follow the typing only while it is a sellable team size; a
                // half-typed "1" on the way to "12" must not snap anywhere.
                if (Number.isInteger(n) && n >= 1 && n <= maxSelectableAgents) setAgents(n);
              }}
              onBlur={() => {
                // A blank or unreadable box goes back to the current team; a
                // NUMBER out of range clamps. (`Number(typed) || agents` got
                // this wrong: 0 is falsy, so typing 0 restored the old value.)
                const n = Number(typed);
                commit(typed.trim() === '' || !Number.isFinite(n) ? agents : n);
              }}
              className="h-10 w-20 rounded-card border border-border-strong bg-bg text-center text-lg font-semibold tabular-nums"
            />
            <button
              type="button"
              onClick={() => commit(agents + 1)}
              disabled={agents >= maxSelectableAgents}
              aria-label={t('agents.increase')}
              className="h-10 w-10 rounded-full border border-border-strong text-lg font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          <p id="pricing-agents-hint" className="mt-2 max-w-xs text-xs text-muted">
            {t('agents.hint')}
          </p>
        </div>
      </div>

      {/* ── cards ────────────────────────────────────────────────────────── */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const quote = quoteFor(plan, agents);
          const tooBig = plan.pricing !== null && quote === null;
          const larger = tooBig ? firstThatFits(plan) : undefined;
          const name = t(`tier.${plan.id}.name`);

          return (
            <section
              key={plan.id}
              aria-labelledby={`plan-${plan.id}`}
              data-plan={plan.id}
              className={`relative flex flex-col rounded-card border bg-surface p-6 ${
                plan.featured ? 'border-accent shadow-lg ring-1 ring-accent/25' : 'border-border'
              }`}
            >
              {plan.featured ? (
                <span className="absolute -top-3 start-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-fg">
                  {mostPopular}
                </span>
              ) : null}
              <h2 id={`plan-${plan.id}`} className="text-xl font-semibold">
                {name}
              </h2>
              <p className="mt-1 min-h-10 text-sm text-muted">{t(`tier.${plan.id}.who`)}</p>

              {/* price */}
              <div className="mt-4 min-h-28">
                {plan.pricing === null ? (
                  <>
                    {/* One size down from a price: "Custom" is a phrase, and in
                        Hebrew it is two words that must not wrap. */}
                    <p className="text-3xl font-bold leading-10 tracking-tight">{t('card.custom')}</p>
                    <p className="mt-2 text-sm text-muted">{t('card.customSub')}</p>
                  </>
                ) : quote ? (
                  <>
                    <p className="flex items-baseline gap-1.5">
                      <span
                        dir="ltr"
                        data-price
                        className="text-4xl font-bold tracking-tight tabular-nums"
                      >
                        {money(perMonthCents(quote, period))}
                      </span>
                      <span className="text-sm text-muted">{t('card.perMonth')}</span>
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {period === 'yearly'
                        ? t('card.billedYearly', { total: money(quote.yearly_total_cents) })
                        : t('card.billedMonthly')}
                    </p>
                    {period === 'yearly' ? (
                      <p className="text-sm font-medium text-ok">
                        {t('card.saves', { amount: money(quote.yearly_savings_cents) })}
                      </p>
                    ) : null}
                    {cheapest === plan.id && quote.extra_agents > 0 ? (
                      <p className="mt-1 text-xs font-semibold text-accent">
                        {t('card.cheapest', { count: nf.format(agents) })}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      {t('card.upTo', { max: nf.format(plan.pricing.max_agents) })}
                    </p>
                    {larger ? (
                      <p className="mt-2 text-sm text-muted">
                        {t('card.chooseLarger', {
                          count: nf.format(agents),
                          plan: t(`tier.${larger.id}.name`),
                        })}
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {/* what the price covers */}
              <dl className="mt-5 flex-1 space-y-3 border-t border-border pt-5 text-sm">
                <div>
                  <dt className="text-muted">{t('card.agentsRow')}</dt>
                  <dd className="font-semibold">
                    {plan.pricing === null ? (
                      t('card.unlimited')
                    ) : (
                      <>
                        {t('card.includes', { count: nf.format(plan.pricing.included_agents) })}
                        <span className="block font-normal text-muted">
                          {quote && quote.extra_agents > 0
                            ? t('card.breakdown', {
                                included: nf.format(plan.pricing.included_agents),
                                extra: nf.format(quote.extra_agents),
                              })
                            : t('card.extra', {
                                price: money(plan.pricing.extra_agent_monthly_cents),
                              })}
                        </span>
                      </>
                    )}
                  </dd>
                </div>
                {METERED_LIMITS.map((key) => (
                  <div key={key}>
                    <dt className="text-muted">{t(`limits.${key}`)}</dt>
                    <dd className="font-semibold tabular-nums">
                      {plan.limits[key] === null
                        ? t('card.unlimited')
                        : nf.format(plan.limits[key] as number)}
                    </dd>
                  </div>
                ))}
                <div>
                  <dt className="text-muted">{t('card.supportRow')}</dt>
                  <dd className="font-semibold">{t(`card.support.${plan.support}`)}</dd>
                </div>
              </dl>

              <CardLink
                href={plan.cta === 'contact_sales' ? contactHref : getStartedHref}
                className={`mt-6 rounded-full px-5 py-2.5 text-center font-semibold ${
                  plan.featured
                    ? 'bg-accent text-accent-fg hover:bg-accent-hover'
                    : 'border border-border-strong text-fg hover:border-accent hover:text-accent'
                }`}
              >
                {plan.cta === 'contact_sales' ? t('card.contactSales') : t('card.getStarted')}
                <span className="sr-only"> — {name}</span>
              </CardLink>
            </section>
          );
        })}
      </div>
    </div>
  );
}
