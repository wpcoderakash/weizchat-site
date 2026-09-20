/**
 * The plans, as this site shows them.
 *
 * NOTHING HERE IS A PRICE OR A LIMIT. Every number comes from
 * `plan-catalogue.json`, a committed snapshot of the app's published price
 * list (GET /api/public/plans, app ADR-0061), written only by
 * `scripts/sync-plans.mjs` and compared against the live app at release time.
 * This file is a typed view of that snapshot and a few lookups over it.
 *
 * It used to be the other way round — tiers and quotas typed in by hand
 * "copied from the app" — and that copy is how the site went on selling a
 * Free plan the app had withdrawn.
 *
 * There is no arithmetic here either. "Base plus extra agents, minus the
 * yearly discount" is computed once, in the app, and published as a table
 * with a row per team size. `quoteFor` LOOKS A ROW UP. A second
 * implementation of that sum, in another repo, in another rounding, is how a
 * customer gets charged a price the page never showed.
 */
import snapshot from './plan-catalogue.json';

export type PlanId = 'starter' | 'professional' | 'business' | 'enterprise';
export type BillingPeriod = 'monthly' | 'yearly';
export type LimitKey =
  | 'agentSeats'
  | 'campaignMessagesPerMonth'
  | 'aiRunsPerMonth'
  | 'aiAssistPerMonth'
  | 'automationRunsPerMonth'
  | 'chatbotSessionsPerMonth';

export interface Quote {
  readonly agents: number;
  readonly extra_agents: number;
  readonly monthly_cents: number;
  readonly yearly_per_month_cents: number;
  readonly yearly_total_cents: number;
  readonly yearly_savings_cents: number;
}

export interface Plan {
  readonly id: PlanId;
  readonly featured: boolean;
  readonly support: 'email' | 'priority' | 'dedicated';
  readonly cta: 'get_started' | 'contact_sales';
  readonly pricing: {
    readonly monthly_base_cents: number;
    readonly included_agents: number;
    readonly extra_agent_monthly_cents: number;
    readonly max_agents: number;
  } | null;
  /** `null` = unlimited on this plan. */
  readonly limits: Readonly<Record<LimitKey, number | null>>;
  readonly quotes: readonly Quote[];
}

export interface AddOn {
  readonly id: 'agent' | 'ai_replies' | 'campaign_messages' | 'automation_runs';
  readonly limit: LimitKey;
  readonly unit_cents: number;
  readonly unit_size: number;
}

const KNOWN_PLANS: readonly PlanId[] = ['starter', 'professional', 'business', 'enterprise'];

/**
 * Refuse a snapshot this code cannot read, at BUILD time. The sync script
 * validates on the way in; this catches a hand-edited file and a snapshot
 * from a newer app whose shape moved on.
 */
function read(): { plans: readonly Plan[]; addOns: readonly AddOn[] } {
  const doc = snapshot as unknown as {
    schema_version: number;
    plans: Plan[];
    add_ons: AddOn[];
  };
  if (doc.schema_version !== 1) {
    throw new Error(`plan-catalogue.json: schema_version ${doc.schema_version}, this site reads 1`);
  }
  for (const plan of doc.plans) {
    if (!KNOWN_PLANS.includes(plan.id)) {
      // A plan with no words on this site would render as a bare key.
      throw new Error(`plan-catalogue.json: unknown plan "${plan.id}" — add its strings first`);
    }
    if (plan.pricing && plan.quotes.length !== plan.pricing.max_agents) {
      throw new Error(`plan-catalogue.json: ${plan.id} has an incomplete price table`);
    }
  }
  return { plans: doc.plans, addOns: doc.add_ons };
}

const catalogue = read();

export const plans: readonly Plan[] = catalogue.plans;
export const addOns: readonly AddOn[] = catalogue.addOns;
export const currency: string = snapshot.currency;
/** 2000 basis points → 20. For the "Save 20%" badge; never used to compute a price. */
export const annualDiscountPercent: number = snapshot.annual_discount_bps / 100;
export const featureGroups = snapshot.feature_groups as Readonly<Record<string, readonly string[]>>;

/** The limits a card and the comparison table list, in display order. Seats are shown as agents. */
export const METERED_LIMITS: readonly Exclude<LimitKey, 'agentSeats'>[] = [
  'campaignMessagesPerMonth',
  'aiRunsPerMonth',
  'aiAssistPerMonth',
  'automationRunsPerMonth',
  'chatbotSessionsPerMonth',
];

/** The largest team any priced plan is sold to — the top of the agent selector. */
export const maxSelectableAgents: number = Math.max(
  ...plans.map((p) => p.pricing?.max_agents ?? 0),
);

/** The published row for this plan and team size, or null when it is not sold at that size. */
export function quoteFor(plan: Plan, agents: number): Quote | null {
  if (!plan.pricing) return null;
  return plan.quotes[agents - 1] ?? null;
}

/** What one month costs under a billing period — read from the row, not derived. */
export function perMonthCents(quote: Quote, period: BillingPeriod): number {
  return period === 'yearly' ? quote.yearly_per_month_cents : quote.monthly_cents;
}

/**
 * The cheapest priced plan that can seat this team. A COMPARISON of published
 * numbers, not a calculation. Ties go to the earlier (smaller) plan.
 */
export function cheapestPlanFor(agents: number, period: BillingPeriod): PlanId | null {
  let best: { id: PlanId; cents: number } | null = null;
  for (const plan of plans) {
    const quote = quoteFor(plan, agents);
    if (!quote) continue;
    const cents = perMonthCents(quote, period);
    if (best === null || cents < best.cents) best = { id: plan.id, cents };
  }
  return best?.id ?? null;
}
