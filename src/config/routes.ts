/**
 * The site's URL structure (brief SECTION 4) in one place, so Nav and Footer
 * can never drift apart. Pages are built in later steps; the paths are final.
 */
export const solutionRoutes = [
  { href: '/shared-inbox', key: 'sharedInbox' },
  { href: '/ai-sales-agent', key: 'aiSalesAgent' },
  { href: '/chatbot', key: 'chatbot' },
  { href: '/crm', key: 'crm' },
  { href: '/integrations', key: 'integrations' },
  { href: '/campaigns', key: 'campaigns', comingSoon: true },
] as const;

export const toolRoutes = [
  { href: '/tools/chat-link-generator', key: 'chatLink' },
  { href: '/tools/qr-code-generator', key: 'qrCode' },
  { href: '/tools/chat-widget-generator', key: 'chatWidget' },
  { href: '/tools/template-checker', key: 'templateChecker' },
  { href: '/tools/conversation-pricing-calculator', key: 'pricingCalculator' },
] as const;

export const resourceRoutes = [
  { href: '/blog', key: 'blog' },
  { href: '/information-center', key: 'informationCenter' },
] as const;

/**
 * Legal documents published in English only (owner's decision, 2026-08-26).
 *
 * The site is bilingual, these documents are not: the owner will not
 * maintain two versions, and a translation that quietly falls out of date
 * is worse than none. English is the binding text — which is independent
 * of the terms being governed by Israeli law.
 *
 * The accessibility statement is deliberately NOT on this list. Israeli
 * accessibility regulations expect a Hebrew statement from an
 * Israeli-facing site, so it stays translated.
 */
export const ENGLISH_ONLY_LEGAL = new Set([
  'privacy-policy',
  'terms',
  'dpa',
  'data-deletion',
  'security',
]);

/**
 * The legal links the footer shows. Owner's choice (2026-08-26): three.
 *
 * `/dpa`, `/data-deletion` and `/security` still resolve — they are simply
 * not linked. `/data-deletion` in particular is a URL Meta asks for during
 * app setup, so it stays reachable rather than 404ing.
 */
export const legalRoutes = [
  { href: '/privacy-policy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
  { href: '/accessibility', key: 'accessibility' },
] as const;
