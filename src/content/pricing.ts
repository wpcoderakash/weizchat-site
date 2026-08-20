/**
 * Pricing tiers — names, amounts and summaries are SECTION-10 items the
 * owner must supply; placeholders render literally until then. One source
 * for the home preview and the /pricing page so they can never disagree.
 */
export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: string;
  summary: string;
  featured?: boolean;
}

export const pricingTiers: readonly PricingTier[] = [
  { id: 'tier-1', name: '__TIER_1_NAME__', monthlyPrice: '__TIER_1_PRICE__', summary: '__TIER_1_SUMMARY__' },
  {
    id: 'tier-2',
    name: '__TIER_2_NAME__',
    monthlyPrice: '__TIER_2_PRICE__',
    summary: '__TIER_2_SUMMARY__',
    featured: true,
  },
  { id: 'tier-3', name: '__TIER_3_NAME__', monthlyPrice: '__TIER_3_PRICE__', summary: '__TIER_3_SUMMARY__' },
];
