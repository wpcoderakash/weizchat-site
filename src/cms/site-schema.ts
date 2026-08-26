import { z } from 'zod';
import { imageSchema, linkSchema, seoSchema } from './schema';

/**
 * Schemas for everything beyond the landing page (ADR-0032, site-wide).
 * Same rules as the landing model: plain data, arrays are display order,
 * nothing the page needs is optional.
 */

const idText = z.object({ id: z.string().min(1), text: z.string().min(1) });
const idTitleBody = z.object({ id: z.string().min(1), title: z.string().min(1), body: z.string().min(1) });

/** One solution page (six instances share this shape). */
export const solutionDocSchema = z.object({
  seo: seoSchema,
  kicker: z.string().min(1),
  title: z.string().min(1),
  sub: z.string().min(1),
  /** null = no screenshot section (campaigns, deliberately). */
  image: imageSchema.nullable(),
  features: z.array(idTitleBody).min(1),
  /** The honesty note; null = the section has none. */
  honest: z.string().nullable(),
  /** Waitlist instead of signup CTAs (brief §4: campaigns). */
  comingSoon: z.boolean(),
});
export type SolutionDoc = z.infer<typeof solutionDocSchema>;

/** A tool page's chrome. The interactive widget itself stays code. */
export const toolDocSchema = z.object({
  seo: seoSchema,
  title: z.string().min(1),
  sub: z.string().min(1),
  howTitle: z.string().min(1),
  how: z.array(z.string().min(1)).min(1).max(6),
});
export type ToolDoc = z.infer<typeof toolDocSchema>;

/**
 * The pricing page's wrapper copy. Tier names, prices and quotas are NOT
 * here — they mirror the product's code-owned plan matrix (ADR-0032).
 */
export const pricingDocSchema = z.object({
  seo: seoSchema,
  title: z.string().min(1),
  sub: z.string().min(1),
  /** ADR-0032 addendum: amounts are owner-editable; names and quotas stay code-owned. */
  prices: z.object({
    free: z.string().min(1),
    pro: z.string().min(1),
    unlimited: z.string().min(1),
  }),
  mostPopular: z.string().min(1),
  perMonth: z.string().min(1),
  campaignQuota: z.string().min(1),
  aiQuota: z.string().min(1),
  unmetered: z.string().min(1),
  talkToUs: z.string().min(1),
  metaNote: z.string().min(1),
  paymentsNote: z.string().min(1),
  includedTitle: z.string().min(1),
  includedBody: z.string().min(1),
  included: z.array(idText).min(1),
  faqTitle: z.string().min(1),
  faq: z.array(z.object({ id: z.string().min(1), q: z.string().min(1), a: z.string().min(1) })).min(1),
  ctaTrial: linkSchema,
  ctaContact: linkSchema,
});
export type PricingDoc = z.infer<typeof pricingDocSchema>;

export const contactDocSchema = z.object({
  seo: seoSchema,
  title: z.string().min(1),
  sub: z.string().min(1),
  formTitle: z.string().min(1),
  formSub: z.string().min(1),
  detailsTitle: z.string().min(1),
  details: z.object({
    legalName: z.string().min(1),
    companyId: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
    /** Defaulted so an already-published contact page keeps parsing. */
    whatsapp: z.string().min(1).default('WhatsApp'),
    email: z.string().min(1),
  }),
  supportTitle: z.string().min(1),
  supportBody: z.string().min(1),
  privacyTitle: z.string().min(1),
  privacyBody: z.string().min(1),
  form: z.object({
    name: z.string().min(1),
    company: z.string().min(1),
    phone: z.string().min(1),
    message: z.string().min(1),
    submit: z.string().min(1),
    note: z.string().min(1),
    success: z.string().min(1),
    error: z.string().min(1),
    emailSubject: z.string().min(1),
    emailBody: z.string().min(1),
  }),
});
export type ContactDoc = z.infer<typeof contactDocSchema>;

/** A legal page: its body is markdown a lawyer can edit whole. */
export const legalDocSchema = z.object({
  seo: seoSchema,
  body: z.string().min(1),
});
export type LegalDoc = z.infer<typeof legalDocSchema>;

/**
 * A number a visitor can act on: what they read, and what the link does.
 *
 * Two fields rather than one because they have genuinely different rules.
 * `label` is for humans and may be spaced or localised however reads best;
 * `number` is machine input and must be strict E.164, because `wa.me`
 * silently accepts a malformed number and lands the visitor on an error
 * page rather than a chat. Splitting them means a pretty label can never
 * break the link.
 */
export const contactPointSchema = z.object({
  label: z.string().min(1),
  number: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Use full international format with no spaces, e.g. +972544747742'),
});
export type ContactPoint = z.infer<typeof contactPointSchema>;

/** One office. `mapUrl` blank derives a maps search from the address. */
export const officeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  address: z.string().min(1),
  mapUrl: z
    .string()
    .refine((v) => v === '' || v.startsWith('https://'), 'Leave blank, or paste a full https:// map link')
    .default(''),
});
export type Office = z.infer<typeof officeSchema>;

/**
 * Contact methods and offices (owner request, 2026-08-26).
 *
 * `.default()` is load-bearing, not tidiness: a `global/site` document is
 * already published, and a newly required field would fail `safeParse`,
 * which silently discards the WHOLE document and falls back to built-ins —
 * every nav and footer edit with it. A default makes older documents parse
 * and adopt the new block instead.
 */
export const contactBlockSchema = z
  .object({
    phone: contactPointSchema,
    whatsapp: contactPointSchema,
    /** Prefilled into the WhatsApp composer. Blank sends an empty chat. */
    whatsappMessage: z.string().default(''),
    officesTitle: z.string().min(1),
    offices: z.array(officeSchema).default([]),
  })
  .default({
    phone: { label: '+380 66 216 9131', number: '+380662169131' },
    whatsapp: { label: '+972 54 474 7742', number: '+972544747742' },
    whatsappMessage: '',
    officesTitle: 'Offices',
    offices: [
      {
        id: 'office-kyiv',
        label: 'Kiev',
        address: 'Gulliver Business Center, 17 Esplanadna Kyiv, Ukraine',
        mapUrl: '',
      },
      {
        id: 'office-israel',
        label: 'Israel',
        address: 'Paz Complex, Moshav Ein Vered',
        mapUrl: '',
      },
    ],
  });
export type ContactBlock = z.infer<typeof contactBlockSchema>;

/**
 * The global chrome, per locale: navigation, footer, site identity and the
 * CTA labels shared across templates. One set of solution/tool labels
 * serves nav AND footer — they used to be duplicated translations.
 *
 * Deliberately absent: the footer's Meta trademark attribution. It is a
 * compliance requirement (brief rule 0.1), not content.
 */
export const globalDocSchema = z.object({
  nav: z.object({
    solutions: z.string().min(1),
    tools: z.string().min(1),
    pricing: z.string().min(1),
    login: z.string().min(1),
    startTrial: z.string().min(1),
    comingSoon: z.string().min(1),
  }),
  solutionLabels: z.object({
    sharedInbox: z.string().min(1),
    aiSalesAgent: z.string().min(1),
    chatbot: z.string().min(1),
    crm: z.string().min(1),
    integrations: z.string().min(1),
    campaigns: z.string().min(1),
  }),
  toolLabels: z.object({
    chatLink: z.string().min(1),
    qrCode: z.string().min(1),
    chatWidget: z.string().min(1),
    templateChecker: z.string().min(1),
    pricingCalculator: z.string().min(1),
  }),
  resourceLabels: z.object({
    blog: z.string().min(1),
    informationCenter: z.string().min(1),
  }),
  footer: z.object({
    tagline: z.string().min(1),
    solutionsTitle: z.string().min(1),
    toolsTitle: z.string().min(1),
    resourcesTitle: z.string().min(1),
    legalTitle: z.string().min(1),
    companyId: z.string().min(1),
    rights: z.string().min(1),
    legalLabels: z.object({
      privacy: z.string().min(1),
      terms: z.string().min(1),
      dpa: z.string().min(1),
      dataDeletion: z.string().min(1),
      accessibility: z.string().min(1),
      security: z.string().min(1),
    }),
  }),
  site: z.object({
    supportEmail: z.string().min(3),
    appUrl: z.string().min(1),
    legalName: z.string().min(1),
    companyId: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
  }),
  contact: contactBlockSchema,
  shared: z.object({
    ctaTrial: z.string().min(1),
    ctaDemo: z.string().min(1),
    comingSoon: z.string().min(1),
    solutionsCloser: z.string().min(1),
    waitlistTitle: z.string().min(1),
    waitlistBody: z.string().min(1),
    waitlistCta: z.string().min(1),
    waitlistNote: z.string().min(1),
    waitlistSuccess: z.string().min(1),
    waitlistError: z.string().min(1),
    waitlistSubject: z.string().min(1),
    waitlistEmailLabel: z.string().min(1),
    waitlistEmailBody: z.string().min(1),
    toolsKicker: z.string().min(1),
    toolsPrivacy: z.string().min(1),
    toolsCloserTitle: z.string().min(1),
    toolsCloserSub: z.string().min(1),
  }),
});
export type GlobalDoc = z.infer<typeof globalDocSchema>;

/** A blog or information-center post. Collection rides in the storage slug. */
export const postDocSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  /** ISO day. Never back-dated automatically. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().min(1)).default([]),
  image: imageSchema.nullable().default(null),
  /** Markdown, rendered through the same pipeline as the MDX articles. */
  body: z.string().min(1),
  noindex: z.boolean().optional(),
});
export type PostDoc = z.infer<typeof postDocSchema>;
