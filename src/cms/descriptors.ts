/**
 * Editor field descriptors — CLIENT-SAFE, no fs, no zod.
 *
 * These live apart from the registry because the registry reads the
 * filesystem for built-in content (server only), while the editor needs
 * the descriptors in the browser — and repeater `newItem` factories are
 * functions, which cannot cross the RSC serialization boundary. The admin
 * passes a page's KIND across the boundary; the client looks the fields
 * up here.
 */
export type Field =
  | { kind: 'text'; path: string; label: string }
  | { kind: 'area'; path: string; label: string; rows?: number; optional?: boolean }
  | { kind: 'markdown'; path: string; label: string }
  | { kind: 'toggle'; path: string; label: string; hint?: string }
  | { kind: 'link'; path: string; label: string }
  | { kind: 'image'; path: string; label: string; optional?: boolean }
  | {
      kind: 'repeater';
      path: string;
      label: string;
      itemLabel: string;
      /** Paths inside an item. Empty path = the item is a plain string. */
      fields: Field[];
      newItem: () => unknown;
    };

export interface FieldGroup {
  title: string;
  fields: Field[];
}



const item = (id: string) => ({ id: `${id}-${Math.random().toString(36).slice(2, 8)}` });

const solutionGroups: FieldGroup[] = [
  {
    title: 'Hero',
    fields: [
      { kind: 'text', path: 'kicker', label: 'Kicker' },
      { kind: 'text', path: 'title', label: 'Headline' },
      { kind: 'area', path: 'sub', label: 'Subhead' },
      { kind: 'toggle', path: 'comingSoon', label: 'Coming soon', hint: 'Shows the waitlist instead of signup buttons, and hides the screenshot.' },
      { kind: 'image', path: 'image', label: 'Product screenshot', optional: true },
    ],
  },
  {
    title: 'Feature cards',
    fields: [
      {
        kind: 'repeater',
        path: 'features',
        label: 'Features',
        itemLabel: 'Feature',
        fields: [
          { kind: 'text', path: 'title', label: 'Title' },
          { kind: 'area', path: 'body', label: 'Body' },
        ],
        newItem: () => ({ ...item('f'), title: 'New feature', body: 'Describe it.' }),
      },
      { kind: 'area', path: 'honest', label: 'Honesty note', optional: true },
    ],
  },
];

const toolGroups: FieldGroup[] = [
  {
    title: 'Page',
    fields: [
      { kind: 'text', path: 'title', label: 'Headline' },
      { kind: 'area', path: 'sub', label: 'Subhead' },
      { kind: 'text', path: 'howTitle', label: '"How it works" heading' },
      {
        kind: 'repeater',
        path: 'how',
        label: 'How it works',
        itemLabel: 'Step',
        fields: [{ kind: 'area', path: '', label: 'Step', rows: 2 }],
        newItem: () => 'New step',
      },
    ],
  },
];

const pricingGroups: FieldGroup[] = [
  {
    title: 'Header',
    fields: [
      { kind: 'text', path: 'title', label: 'Headline' },
      { kind: 'area', path: 'sub', label: 'Subhead' },
    ],
  },
  {
    title: 'Tier cards (names and prices stay mirrored from the product)',
    fields: [
      { kind: 'text', path: 'mostPopular', label: '"Most popular" badge' },
      { kind: 'text', path: 'perMonth', label: '"per month" wording' },
      { kind: 'text', path: 'campaignQuota', label: 'Campaign quota label' },
      { kind: 'text', path: 'aiQuota', label: 'AI quota label' },
      { kind: 'text', path: 'unmetered', label: '"Unmetered" wording' },
      { kind: 'text', path: 'talkToUs', label: 'Tier button text' },
      { kind: 'area', path: 'metaNote', label: 'Meta charges note' },
      { kind: 'area', path: 'paymentsNote', label: 'Payments note' },
    ],
  },
  {
    title: 'Included in every plan',
    fields: [
      { kind: 'text', path: 'includedTitle', label: 'Heading' },
      { kind: 'area', path: 'includedBody', label: 'Body' },
      {
        kind: 'repeater',
        path: 'included',
        label: 'Items',
        itemLabel: 'Item',
        fields: [{ kind: 'text', path: 'text', label: 'Text' }],
        newItem: () => ({ ...item('inc'), text: 'New item' }),
      },
    ],
  },
  {
    title: 'FAQ',
    fields: [
      { kind: 'text', path: 'faqTitle', label: 'Heading' },
      {
        kind: 'repeater',
        path: 'faq',
        label: 'Questions',
        itemLabel: 'Question',
        fields: [
          { kind: 'text', path: 'q', label: 'Question' },
          { kind: 'area', path: 'a', label: 'Answer' },
        ],
        newItem: () => ({ ...item('faq'), q: 'New question', a: 'New answer' }),
      },
    ],
  },
  {
    title: 'Closing buttons',
    fields: [
      { kind: 'link', path: 'ctaTrial', label: 'Trial button' },
      { kind: 'link', path: 'ctaContact', label: 'Contact button' },
    ],
  },
];

const contactGroups: FieldGroup[] = [
  {
    title: 'Header',
    fields: [
      { kind: 'text', path: 'title', label: 'Headline' },
      { kind: 'area', path: 'sub', label: 'Subhead' },
    ],
  },
  {
    title: 'Form',
    fields: [
      { kind: 'text', path: 'formTitle', label: 'Form heading' },
      { kind: 'area', path: 'formSub', label: 'Form intro' },
      { kind: 'text', path: 'form.name', label: 'Name label' },
      { kind: 'text', path: 'form.company', label: 'Company label' },
      { kind: 'text', path: 'form.phone', label: 'Phone label' },
      { kind: 'text', path: 'form.message', label: 'Message label' },
      { kind: 'text', path: 'form.submit', label: 'Submit button' },
      { kind: 'area', path: 'form.note', label: 'Form note' },
      { kind: 'text', path: 'form.success', label: 'Success message' },
      { kind: 'text', path: 'form.error', label: 'Error message' },
      { kind: 'text', path: 'form.emailSubject', label: 'Email subject' },
      { kind: 'area', path: 'form.emailBody', label: 'Email template ({name}, {company}, {phone}, {message})' },
    ],
  },
  {
    title: 'Company details card',
    fields: [
      { kind: 'text', path: 'detailsTitle', label: 'Heading' },
      { kind: 'text', path: 'details.legalName', label: 'Legal name label' },
      { kind: 'text', path: 'details.companyId', label: 'Company number label' },
      { kind: 'text', path: 'details.address', label: 'Address label' },
      { kind: 'text', path: 'details.phone', label: 'Phone label' },
      { kind: 'text', path: 'details.email', label: 'Email label' },
    ],
  },
  {
    title: 'Side cards',
    fields: [
      { kind: 'text', path: 'supportTitle', label: 'Support card heading' },
      { kind: 'area', path: 'supportBody', label: 'Support card body' },
      { kind: 'text', path: 'privacyTitle', label: 'Privacy card heading' },
      { kind: 'area', path: 'privacyBody', label: 'Privacy card body' },
    ],
  },
];

const legalGroups: FieldGroup[] = [
  {
    title: 'Document',
    fields: [{ kind: 'markdown', path: 'body', label: 'Body (markdown — the # heading is the page title)' }],
  },
];


/** Field groups per page kind. null = the landing page's bespoke editor. */
export const GROUPS: Record<string, FieldGroup[] | null> = {
  landing: null,
  solution: solutionGroups,
  tool: toolGroups,
  pricing: pricingGroups,
  contact: contactGroups,
  legal: legalGroups,
};

export const globalGroups: FieldGroup[] = [
  {
    title: 'Navigation',
    fields: [
      { kind: 'text', path: 'nav.solutions', label: 'Solutions menu' },
      { kind: 'text', path: 'nav.tools', label: 'Tools menu' },
      { kind: 'text', path: 'nav.pricing', label: 'Pricing link' },
      { kind: 'text', path: 'nav.login', label: 'Login button' },
      { kind: 'text', path: 'nav.startTrial', label: 'Trial button' },
      { kind: 'text', path: 'nav.comingSoon', label: '"Coming soon" badge' },
    ],
  },
  {
    title: 'Menu labels (shared by nav and footer)',
    fields: [
      { kind: 'text', path: 'solutionLabels.sharedInbox', label: 'Shared inbox' },
      { kind: 'text', path: 'solutionLabels.aiSalesAgent', label: 'AI sales agent' },
      { kind: 'text', path: 'solutionLabels.chatbot', label: 'Chatbot' },
      { kind: 'text', path: 'solutionLabels.crm', label: 'CRM' },
      { kind: 'text', path: 'solutionLabels.integrations', label: 'Integrations' },
      { kind: 'text', path: 'solutionLabels.campaigns', label: 'Campaigns' },
      { kind: 'text', path: 'toolLabels.chatLink', label: 'Chat link tool' },
      { kind: 'text', path: 'toolLabels.qrCode', label: 'QR tool' },
      { kind: 'text', path: 'toolLabels.chatWidget', label: 'Widget tool' },
      { kind: 'text', path: 'toolLabels.templateChecker', label: 'Template checker' },
      { kind: 'text', path: 'toolLabels.pricingCalculator', label: 'Pricing calculator' },
      { kind: 'text', path: 'resourceLabels.blog', label: 'Blog' },
      { kind: 'text', path: 'resourceLabels.informationCenter', label: 'Information center' },
    ],
  },
  {
    title: 'Footer',
    fields: [
      { kind: 'area', path: 'footer.tagline', label: 'Tagline', rows: 2 },
      { kind: 'text', path: 'footer.solutionsTitle', label: 'Solutions column title' },
      { kind: 'text', path: 'footer.toolsTitle', label: 'Tools column title' },
      { kind: 'text', path: 'footer.resourcesTitle', label: 'Resources column title' },
      { kind: 'text', path: 'footer.legalTitle', label: 'Legal column title' },
      { kind: 'text', path: 'footer.companyId', label: 'Company-number label' },
      { kind: 'text', path: 'footer.rights', label: '"All rights reserved"' },
      { kind: 'text', path: 'footer.legalLabels.privacy', label: 'Privacy link' },
      { kind: 'text', path: 'footer.legalLabels.terms', label: 'Terms link' },
      { kind: 'text', path: 'footer.legalLabels.dpa', label: 'DPA link' },
      { kind: 'text', path: 'footer.legalLabels.dataDeletion', label: 'Data deletion link' },
      { kind: 'text', path: 'footer.legalLabels.accessibility', label: 'Accessibility link' },
      { kind: 'text', path: 'footer.legalLabels.security', label: 'Security link' },
    ],
  },
  {
    title: 'Company identity (footer, contact page, JSON-LD)',
    fields: [
      { kind: 'text', path: 'site.legalName', label: 'Legal name' },
      { kind: 'text', path: 'site.companyId', label: 'Company number' },
      { kind: 'text', path: 'site.address', label: 'Address' },
      { kind: 'text', path: 'site.phone', label: 'Phone' },
      { kind: 'text', path: 'site.supportEmail', label: 'Support email' },
      { kind: 'text', path: 'site.appUrl', label: 'App URL (login buttons)' },
    ],
  },
  {
    title: 'Shared buttons and blurbs',
    fields: [
      { kind: 'text', path: 'shared.ctaTrial', label: 'Trial button' },
      { kind: 'text', path: 'shared.ctaDemo', label: 'Demo button' },
      { kind: 'text', path: 'shared.comingSoon', label: '"Coming soon" badge' },
      { kind: 'text', path: 'shared.solutionsCloser', label: 'Solution pages closing line' },
      { kind: 'text', path: 'shared.waitlistTitle', label: 'Waitlist title' },
      { kind: 'area', path: 'shared.waitlistBody', label: 'Waitlist body', rows: 2 },
      { kind: 'text', path: 'shared.waitlistCta', label: 'Waitlist button' },
      { kind: 'area', path: 'shared.waitlistNote', label: 'Waitlist note', rows: 2 },
      { kind: 'text', path: 'shared.waitlistSuccess', label: 'Waitlist success message' },
      { kind: 'text', path: 'shared.waitlistError', label: 'Waitlist error message' },
      { kind: 'text', path: 'shared.waitlistSubject', label: 'Waitlist email subject' },
      { kind: 'text', path: 'shared.waitlistEmailLabel', label: 'Waitlist email label' },
      { kind: 'area', path: 'shared.waitlistEmailBody', label: 'Waitlist email template ({email})', rows: 2 },
      { kind: 'text', path: 'shared.toolsKicker', label: 'Tools kicker' },
      { kind: 'area', path: 'shared.toolsPrivacy', label: 'Tools privacy note', rows: 2 },
      { kind: 'text', path: 'shared.toolsCloserTitle', label: 'Tools closing title' },
      { kind: 'area', path: 'shared.toolsCloserSub', label: 'Tools closing subline', rows: 2 },
    ],
  },
];
