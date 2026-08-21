/**
 * Free tools (brief §4): top-of-funnel, all client-side, nothing stored.
 * Each has its own SEO landing page; the slugs are fixed by the brief.
 */
export const tools = [
  { slug: 'chat-link-generator', key: 'chatLink' },
  { slug: 'qr-code-generator', key: 'qrCode' },
  { slug: 'chat-widget-generator', key: 'chatWidget' },
  { slug: 'template-checker', key: 'templateChecker' },
  { slug: 'conversation-pricing-calculator', key: 'pricingCalculator' },
] as const;

export type ToolSlug = (typeof tools)[number]['slug'];
