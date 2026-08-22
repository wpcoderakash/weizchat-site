import { z } from 'zod';

/**
 * The landing page content model (ADR-0032).
 *
 * This is the contract between the admin editor and the page. It is
 * deliberately plain data — strings, booleans, arrays — with no React and
 * no i18n calls, so the exact same shape can arrive from a TypeScript file
 * today and from the platform CMS over HTTP tomorrow without a component
 * changing.
 *
 * Three rules the shape enforces:
 *
 *  1. Every section carries `visible`. Hiding is content, not a code edit,
 *     and a hidden section must not render at all — not render empty.
 *  2. Every repeater is an array. Order in the array IS the order on the
 *     page, so drag-and-drop in the editor needs no separate sort column.
 *  3. Nothing is optional that the page needs. A missing field is a
 *     validation error at load, surfaced loudly in development, rather
 *     than an empty heading discovered by a visitor.
 */

/** A button or link. `enabled: false` keeps it in the editor, off the page. */
export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  /** External links open in a new tab; the renderer adds rel itself. */
  newTab: z.boolean().default(false),
  enabled: z.boolean().default(true),
});
export type CmsLink = z.infer<typeof linkSchema>;

/**
 * An image reference. `src` is a path the site can serve — today a file in
 * public/, later a media-library id resolved to a URL at load time.
 */
export const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
});
export type CmsImage = z.infer<typeof imageSchema>;

/** Fields every section shares. */
const sectionBase = {
  visible: z.boolean().default(true),
};

/** A titled item with body copy — the shape most repeaters need. */
const itemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});
export type CmsItem = z.infer<typeof itemSchema>;

export const heroSchema = z.object({
  ...sectionBase,
  id: z.literal('hero'),
  title: z.string().min(1),
  sub: z.string().min(1),
  primary: linkSchema,
  secondary: linkSchema,
  image: imageSchema,
});

export const trustSchema = z.object({
  ...sectionBase,
  id: z.literal('trust'),
  label: z.string().min(1),
  /** Factual claims only (brief rule 0.2). Order is display order. */
  facts: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(1),
  /** Rendered only when site.metaPartnerStatus is not 'none'. */
  techProvider: z.string().min(1),
  businessPartner: z.string().min(1),
});

export const problemSchema = z.object({
  ...sectionBase,
  id: z.literal('problem'),
  title: z.string().min(1),
  items: z.array(itemSchema).min(1),
});

export const pillarsSchema = z.object({
  ...sectionBase,
  id: z.literal('pillars'),
  title: z.string().min(1),
  linkLabel: z.string().min(1),
  items: z
    .array(
      itemSchema.extend({
        href: z.string().min(1),
        /** Names a glyph in the pillar icon set; not free-form SVG. */
        icon: z.enum(['inbox', 'ai', 'bot']),
      }),
    )
    .min(1),
});

export const aiSchema = z.object({
  ...sectionBase,
  id: z.literal('ai'),
  kicker: z.string().min(1),
  title: z.string().min(1),
  /** The numbered flow. Numbering is positional, so order is meaning. */
  steps: z.array(itemSchema).min(1),
  honest: z.string().min(1),
});

export const platformSchema = z.object({
  ...sectionBase,
  id: z.literal('platform'),
  title: z.string().min(1),
  body: z.string().min(1),
  link: linkSchema,
  cards: z.array(itemSchema).min(1),
});

export const useCasesSchema = z.object({
  ...sectionBase,
  id: z.literal('useCases'),
  title: z.string().min(1),
  tabs: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        points: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1),
});

export const crmSchema = z.object({
  ...sectionBase,
  id: z.literal('crm'),
  title: z.string().min(1),
  body: z.string().min(1),
  link: linkSchema,
  features: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(1),
});

export const testimonialsSchema = z.object({
  ...sectionBase,
  id: z.literal('testimonials'),
  title: z.string().min(1),
  /**
   * Written consent is a publishing precondition, not a preference: the
   * literal `true` means the editor cannot save an entry without it, and
   * an empty list renders no section at all.
   */
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quote: z.string().min(1),
        author: z.string().min(1),
        company: z.string().min(1),
        consentOnFile: z.literal(true),
      }),
    )
    .default([]),
});

export const pricingSchema = z.object({
  ...sectionBase,
  id: z.literal('pricing'),
  title: z.string().min(1),
  perMonth: z.string().min(1),
  /** Meta bills conversations separately. Required, never blank. */
  metaNote: z.string().min(1),
  cta: linkSchema,
});

export const faqSchema = z.object({
  ...sectionBase,
  id: z.literal('faq'),
  title: z.string().min(1),
  /** Emitted as FAQPage JSON-LD in this order. */
  items: z
    .array(z.object({ id: z.string().min(1), q: z.string().min(1), a: z.string().min(1) }))
    .min(1),
});

export const finalCtaSchema = z.object({
  ...sectionBase,
  id: z.literal('finalCta'),
  title: z.string().min(1),
  sub: z.string().min(1),
  primary: linkSchema,
  secondary: linkSchema,
});

export const sectionSchema = z.discriminatedUnion('id', [
  heroSchema,
  trustSchema,
  problemSchema,
  pillarsSchema,
  aiSchema,
  platformSchema,
  useCasesSchema,
  crmSchema,
  testimonialsSchema,
  pricingSchema,
  faqSchema,
  finalCtaSchema,
]);
export type CmsSection = z.infer<typeof sectionSchema>;
export type CmsSectionId = CmsSection['id'];

/** Per-page SEO the editor owns (brief §10). */
export const seoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: imageSchema.optional(),
  canonical: z.string().optional(),
});

export const landingPageSchema = z.object({
  slug: z.literal('home'),
  locale: z.string().min(2),
  /** Unpublished pages fall back to the built-in content. */
  published: z.boolean().default(true),
  seo: seoSchema,
  /** Array order is render order — the editor's drag handle writes here. */
  sections: z.array(sectionSchema).min(1),
});
export type LandingPage = z.infer<typeof landingPageSchema>;

/** Narrows the union so a renderer gets the section type it expects. */
export function findSection<K extends CmsSectionId>(
  page: LandingPage,
  id: K,
): Extract<CmsSection, { id: K }> | null {
  const found = page.sections.find((section) => section.id === id);
  return (found as Extract<CmsSection, { id: K }> | undefined) ?? null;
}
