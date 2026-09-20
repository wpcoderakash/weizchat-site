/**
 * Pricing tiers.
 *
 * The tier names and the LIMITS are real product facts, copied from the
 * app's code-owned plan matrix (@app/core PLANS, ADR-0059, ADR-0060) so
 * marketing and product can never disagree: Pro 10 agents / 10,000 campaign
 * messages / 5,000 AI replies a month; Unlimited unmetered.
 *
 * There is no free tier (ADR-0060). A workspace can be created and set up
 * without a subscription, but connecting a number, sending, campaigns and
 * the AI wait for a plan — so the page sells the two plans that exist and
 * nothing that does not.
 *
 * The PRICES are not here: they are CMS content on the pricing document
 * (ADR-0032 addendum), edited on the Pricing page in the admin. Every
 * surface that shows an amount reads that one document.
 */
export interface PricingTier {
  id: 'pro' | 'unlimited';
  /** messages key under `pricing.tier.` */
  key: string;
  /** null = unmetered, mirrors PLANS[].campaignMessagesPerMonth */
  campaignMessagesPerMonth: number | null;
  /** null = unmetered, mirrors PLANS[].aiRunsPerMonth */
  aiRepliesPerMonth: number | null;
  /** null = unlimited, mirrors PLANS[].agentSeats (ADR-0059) */
  agentSeats: number | null;
  featured?: boolean;
}

export const pricingTiers: readonly PricingTier[] = [
  {
    id: 'pro',
    key: 'pro',
    agentSeats: 10,
    campaignMessagesPerMonth: 10_000,
    aiRepliesPerMonth: 5000,
    featured: true,
  },
  {
    id: 'unlimited',
    key: 'unlimited',
    agentSeats: null,
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
