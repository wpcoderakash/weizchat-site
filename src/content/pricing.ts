/**
 * Pricing tiers.
 *
 * The tier names and the LIMITS are real product facts, copied from the
 * app's code-owned plan matrix (@app/core PLANS, ADR-0028) so marketing and
 * product can never disagree: Free 1,000 / Pro 10,000 / Unlimited unmetered
 * campaign messages, and 500 / 5,000 / unmetered AI replies per month.
 *
 * The PRICES are a SECTION-10 item the owner must supply — they render as
 * literal `__TIER_*_PRICE__` placeholders until then. Never invent one.
 */
export interface PricingTier {
  id: 'free' | 'pro' | 'unlimited';
  /** messages key under `pricing.tier.` */
  key: string;
  monthlyPrice: string;
  /** null = unmetered, mirrors PLANS[].campaignMessagesPerMonth */
  campaignMessagesPerMonth: number | null;
  /** null = unmetered, mirrors PLANS[].aiRunsPerMonth */
  aiRepliesPerMonth: number | null;
  featured?: boolean;
}

export const pricingTiers: readonly PricingTier[] = [
  {
    id: 'free',
    key: 'free',
    monthlyPrice: '__TIER_FREE_PRICE__',
    campaignMessagesPerMonth: 1000,
    aiRepliesPerMonth: 500,
  },
  {
    id: 'pro',
    key: 'pro',
    monthlyPrice: '__TIER_PRO_PRICE__',
    campaignMessagesPerMonth: 10_000,
    aiRepliesPerMonth: 5000,
    featured: true,
  },
  {
    id: 'unlimited',
    key: 'unlimited',
    monthlyPrice: '__TIER_UNLIMITED_PRICE__',
    campaignMessagesPerMonth: null,
    aiRepliesPerMonth: null,
  },
];

/** Everything in every plan — the product has no feature-gated tiers today. */
export const includedInEveryPlan = [
  'inbox',
  'ai',
  'chatbot',
  'crm',
  'templates',
  'analytics',
  'roles',
  'locales',
] as const;
