import type { z } from 'zod';
import type { FieldGroup } from './descriptors';
import { GROUPS } from './descriptors';
import { landingPageSchema } from './schema';
import {
  contactDocSchema,
  legalDocSchema,
  pricingDocSchema,
  solutionDocSchema,
  toolDocSchema,
} from './site-schema';
import {
  contactDefault,
  legalDefault,
  pricingDefault,
  solutionDefault,
  toolDefault,
} from './defaults';
import { homeEN } from './content/home.en';
import { homeHE } from './content/home.he';

/**
 * The page registry — the scalability requirement made concrete.
 *
 * Every manageable page is one entry: its schema, its built-in content,
 * its public path, and a declarative list of editor fields. The admin's
 * page list, the generic editor, the preview and the revalidation map all
 * read THIS, so adding a page to the site means adding an entry here —
 * not building another editor.
 *
 * The landing page is the one exception: its twelve heterogeneous
 * sections earned a bespoke editor, and `fields: null` says so.
 */

export interface PageDef {
  slug: string;
  /** What the admin list calls it. */
  title: string;
  kind: 'landing' | 'solution' | 'tool' | 'pricing' | 'contact' | 'legal';
  schema: z.ZodType;
  builtIn: (locale: string) => unknown;
  /** Path relative to the locale root, e.g. '/pricing'. '' = the home page. */
  publicPath: string;
  /** null = a bespoke editor exists (the landing page). */
  groups: FieldGroup[] | null;
}

function page(
  slug: string,
  title: string,
  kind: PageDef['kind'],
  schema: z.ZodType,
  builtIn: PageDef['builtIn'],
  publicPath: string,
  groups: FieldGroup[] | null,
): PageDef {
  return { slug, title, kind, schema, builtIn, publicPath, groups };
}

export const PAGES: PageDef[] = [
  page('home', 'Landing page', 'landing', landingPageSchema, (l) => (l === 'he' ? homeHE : homeEN), '', null),
  page('shared-inbox', 'Shared team inbox', 'solution', solutionDocSchema, (l) => solutionDefault('shared-inbox', l), '/shared-inbox', GROUPS['solution']!),
  page('ai-sales-agent', 'AI sales agent', 'solution', solutionDocSchema, (l) => solutionDefault('ai-sales-agent', l), '/ai-sales-agent', GROUPS['solution']!),
  page('chatbot', 'Chatbot & automation', 'solution', solutionDocSchema, (l) => solutionDefault('chatbot', l), '/chatbot', GROUPS['solution']!),
  page('crm', 'WhatsApp CRM', 'solution', solutionDocSchema, (l) => solutionDefault('crm', l), '/crm', GROUPS['solution']!),
  page('integrations', 'Integrations', 'solution', solutionDocSchema, (l) => solutionDefault('integrations', l), '/integrations', GROUPS['solution']!),
  page('campaigns', 'Campaigns', 'solution', solutionDocSchema, (l) => solutionDefault('campaigns', l), '/campaigns', GROUPS['solution']!),
  page('pricing', 'Pricing', 'pricing', pricingDocSchema, pricingDefault, '/pricing', GROUPS['pricing']!),
  page('contact', 'Contact', 'contact', contactDocSchema, contactDefault, '/contact', GROUPS['contact']!),
  page('chat-link-generator', 'Tool: chat link generator', 'tool', toolDocSchema, (l) => toolDefault('chat-link-generator', l), '/tools/chat-link-generator', GROUPS['tool']!),
  page('qr-code-generator', 'Tool: QR code generator', 'tool', toolDocSchema, (l) => toolDefault('qr-code-generator', l), '/tools/qr-code-generator', GROUPS['tool']!),
  page('chat-widget-generator', 'Tool: chat widget generator', 'tool', toolDocSchema, (l) => toolDefault('chat-widget-generator', l), '/tools/chat-widget-generator', GROUPS['tool']!),
  page('template-checker', 'Tool: template checker', 'tool', toolDocSchema, (l) => toolDefault('template-checker', l), '/tools/template-checker', GROUPS['tool']!),
  page('conversation-pricing-calculator', 'Tool: pricing calculator', 'tool', toolDocSchema, (l) => toolDefault('conversation-pricing-calculator', l), '/tools/conversation-pricing-calculator', GROUPS['tool']!),
  page('privacy-policy', 'Privacy policy', 'legal', legalDocSchema, (l) => legalDefault('privacy-policy', l), '/privacy-policy', GROUPS['legal']!),
  page('terms', 'Terms of service', 'legal', legalDocSchema, (l) => legalDefault('terms', l), '/terms', GROUPS['legal']!),
  page('dpa', 'Data processing addendum', 'legal', legalDocSchema, (l) => legalDefault('dpa', l), '/dpa', GROUPS['legal']!),
  page('accessibility', 'Accessibility statement', 'legal', legalDocSchema, (l) => legalDefault('accessibility', l), '/accessibility', GROUPS['legal']!),
  page('data-deletion', 'Data deletion', 'legal', legalDocSchema, (l) => legalDefault('data-deletion', l), '/data-deletion', GROUPS['legal']!),
  page('security', 'Security', 'legal', legalDocSchema, (l) => legalDefault('security', l), '/security', GROUPS['legal']!),
];

export function pageBySlug(slug: string): PageDef | null {
  return PAGES.find((p) => p.slug === slug) ?? null;
}

/** The public URL for a page in a locale — matches the routing prefixes. */
export function publicUrl(def: PageDef, locale: string): string {
  const prefix = locale === 'he' ? '/heb' : '';
  return `${prefix}${def.publicPath}` || '/';
}
