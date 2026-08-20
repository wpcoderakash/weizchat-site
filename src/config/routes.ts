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

export const legalRoutes = [
  { href: '/privacy-policy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
  { href: '/dpa', key: 'dpa' },
  { href: '/data-deletion', key: 'dataDeletion' },
  { href: '/accessibility', key: 'accessibility' },
  { href: '/security', key: 'security' },
] as const;
