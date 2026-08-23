import fs from 'node:fs';
import path from 'node:path';
import type {
  ContactDoc,
  GlobalDoc,
  LegalDoc,
  PostDoc,
  PricingDoc,
  SolutionDoc,
  ToolDoc,
} from './site-schema';

/**
 * Built-in documents, derived from the SAME sources the site rendered
 * from before the CMS existed: `messages/{locale}.json` and the legal /
 * article MDX files. Derivation instead of duplication is the point — an
 * empty content store renders today's site verbatim because the fallback
 * IS today's content, not a copy of it that can rot.
 */

type Messages = Record<string, Record<string, unknown>>;
const cache = new Map<string, Messages>();

function messages(locale: string): Messages {
  const key = locale === 'he' ? 'he' : 'en';
  if (!cache.has(key)) {
    const file = path.join(process.cwd(), 'messages', `${key}.json`);
    cache.set(key, JSON.parse(fs.readFileSync(file, 'utf8')) as Messages);
  }
  return cache.get(key)!;
}

/** Dot-path lookup that throws loudly — a missing default is a build bug. */
function t(locale: string, dotPath: string): string {
  let node: unknown = messages(locale);
  for (const part of dotPath.split('.')) {
    node = (node as Record<string, unknown>)?.[part];
  }
  if (typeof node !== 'string') throw new Error(`[cms defaults] missing message: ${dotPath} (${locale})`);
  return node;
}

const APP_LOGIN = 'https://app.weiz.chat/login';

// ── Solutions ───────────────────────────────────────────────────────────────

const SOLUTION_META: Record<
  string,
  { key: string; image: { src: string } | null; featureCount: number; hasHonest: boolean; comingSoon: boolean }
> = {
  'shared-inbox': { key: 'sharedInbox', image: { src: '/product/inbox-chat.png' }, featureCount: 6, hasHonest: false, comingSoon: false },
  'ai-sales-agent': { key: 'aiSalesAgent', image: { src: '/product/ai-agent.png' }, featureCount: 6, hasHonest: true, comingSoon: false },
  chatbot: { key: 'chatbot', image: { src: '/product/chatbot.png' }, featureCount: 6, hasHonest: true, comingSoon: false },
  crm: { key: 'crm', image: { src: '/product/customers.png' }, featureCount: 6, hasHonest: false, comingSoon: false },
  integrations: { key: 'integrations', image: { src: '/product/whatsapp.png' }, featureCount: 5, hasHonest: true, comingSoon: false },
  campaigns: { key: 'campaigns', image: null, featureCount: 4, hasHonest: false, comingSoon: true },
};

export function solutionDefault(slug: string, locale: string): SolutionDoc {
  const meta = SOLUTION_META[slug];
  if (!meta) throw new Error(`unknown solution: ${slug}`);
  const ns = `solutions.${meta.key}`;
  return {
    seo: { title: t(locale, `${ns}.metaTitle`), description: t(locale, `${ns}.metaDescription`) },
    kicker: t(locale, `${ns}.kicker`),
    title: t(locale, `${ns}.title`),
    sub: t(locale, `${ns}.sub`),
    image: meta.image ? { src: meta.image.src, alt: t(locale, `${ns}.imageAlt`) } : null,
    features: Array.from({ length: meta.featureCount }, (_, i) => ({
      id: `f${i + 1}`,
      title: t(locale, `${ns}.f${i + 1}.title`),
      body: t(locale, `${ns}.f${i + 1}.body`),
    })),
    honest: meta.hasHonest ? t(locale, `${ns}.honest`) : null,
    comingSoon: meta.comingSoon,
  };
}

// ── Tools ───────────────────────────────────────────────────────────────────

const TOOL_KEYS: Record<string, string> = {
  'chat-link-generator': 'chatLink',
  'qr-code-generator': 'qrCode',
  'chat-widget-generator': 'chatWidget',
  'template-checker': 'templateChecker',
  'conversation-pricing-calculator': 'pricingCalculator',
};

export function toolDefault(slug: string, locale: string): ToolDoc {
  const key = TOOL_KEYS[slug];
  if (!key) throw new Error(`unknown tool: ${slug}`);
  const ns = `tools.${key}`;
  return {
    seo: { title: t(locale, `${ns}.metaTitle`), description: t(locale, `${ns}.metaDescription`) },
    title: t(locale, `${ns}.title`),
    sub: t(locale, `${ns}.sub`),
    howTitle: t(locale, `${ns}.howTitle`),
    how: ['s1', 's2', 's3'].map((s) => t(locale, `${ns}.how.${s}`)),
  };
}

// ── Pricing ─────────────────────────────────────────────────────────────────

export function pricingDefault(locale: string): PricingDoc {
  const ns = 'pricing';
  const included = ['inbox', 'ai', 'chatbot', 'crm', 'templates', 'analytics', 'roles', 'locales'];
  const faq = ['whoCharges', 'overQuota', 'switch', 'trial'];
  return {
    seo: { title: t(locale, `${ns}.metaTitle`), description: t(locale, `${ns}.metaDescription`) },
    title: t(locale, `${ns}.title`),
    sub: t(locale, `${ns}.sub`),
    prices: {
      free: t(locale, `${ns}.tier.free.price`),
      pro: t(locale, `${ns}.tier.pro.price`),
      unlimited: t(locale, `${ns}.tier.unlimited.price`),
    },
    mostPopular: t(locale, `${ns}.mostPopular`),
    perMonth: t(locale, `${ns}.perMonth`),
    campaignQuota: t(locale, `${ns}.campaignQuota`),
    aiQuota: t(locale, `${ns}.aiQuota`),
    unmetered: t(locale, `${ns}.unmetered`),
    talkToUs: t(locale, `${ns}.talkToUs`),
    metaNote: t(locale, `${ns}.metaNote`),
    paymentsNote: t(locale, `${ns}.paymentsNote`),
    includedTitle: t(locale, `${ns}.includedTitle`),
    includedBody: t(locale, `${ns}.includedBody`),
    included: included.map((id) => ({ id, text: t(locale, `${ns}.included.${id}`) })),
    faqTitle: t(locale, `${ns}.faqTitle`),
    faq: faq.map((id) => ({ id, q: t(locale, `${ns}.faq.${id}.q`), a: t(locale, `${ns}.faq.${id}.a`) })),
    ctaTrial: { label: t(locale, `${ns}.ctaTrial`), href: APP_LOGIN, newTab: false, enabled: true },
    ctaContact: { label: t(locale, `${ns}.ctaContact`), href: '/contact', newTab: false, enabled: true },
  };
}

// ── Contact ─────────────────────────────────────────────────────────────────

export function contactDefault(locale: string): ContactDoc {
  const ns = 'contact';
  return {
    seo: { title: t(locale, `${ns}.metaTitle`), description: t(locale, `${ns}.metaDescription`) },
    title: t(locale, `${ns}.title`),
    sub: t(locale, `${ns}.sub`),
    formTitle: t(locale, `${ns}.formTitle`),
    formSub: t(locale, `${ns}.formSub`),
    detailsTitle: t(locale, `${ns}.detailsTitle`),
    details: {
      legalName: t(locale, `${ns}.details.legalName`),
      companyId: t(locale, `${ns}.details.companyId`),
      address: t(locale, `${ns}.details.address`),
      phone: t(locale, `${ns}.details.phone`),
      email: t(locale, `${ns}.details.email`),
    },
    supportTitle: t(locale, `${ns}.supportTitle`),
    supportBody: t(locale, `${ns}.supportBody`),
    privacyTitle: t(locale, `${ns}.privacyTitle`),
    privacyBody: t(locale, `${ns}.privacyBody`),
    form: {
      name: t(locale, `${ns}.form.name`),
      company: t(locale, `${ns}.form.company`),
      phone: t(locale, `${ns}.form.phone`),
      message: t(locale, `${ns}.form.message`),
      submit: t(locale, `${ns}.form.submit`),
      note: t(locale, `${ns}.form.note`),
      success: t(locale, `${ns}.form.success`),
      error: t(locale, `${ns}.form.error`),
      emailSubject: t(locale, `${ns}.form.emailSubject`),
      emailBody: t(locale, `${ns}.form.emailBody`),
    },
  };
}

// ── Legal ───────────────────────────────────────────────────────────────────

const LEGAL_TITLE_KEY: Record<string, string> = {
  'privacy-policy': 'privacy',
  terms: 'terms',
  dpa: 'dpa',
  accessibility: 'accessibility',
  'data-deletion': 'dataDeletion',
  security: 'security',
};

export function legalDefault(slug: string, locale: string): LegalDoc {
  const titleKey = LEGAL_TITLE_KEY[slug];
  if (!titleKey) throw new Error(`unknown legal page: ${slug}`);
  const file = path.join(process.cwd(), 'src', 'content', 'legal', `${slug}.${locale}.mdx`);
  return {
    seo: {
      title: t(locale, `footer.legal.${titleKey}`),
      description: t(locale, `footer.legal.${titleKey}`),
    },
    body: fs.readFileSync(file, 'utf8'),
  };
}

// ── Global chrome ───────────────────────────────────────────────────────────

export function globalDefault(locale: string): GlobalDoc {
  const sol = (k: string) => t(locale, `nav.solution.${k}`);
  const tool = (k: string) => t(locale, `nav.tool.${k}`);
  return {
    nav: {
      solutions: t(locale, 'nav.solutions'),
      tools: t(locale, 'nav.tools'),
      pricing: t(locale, 'nav.pricing'),
      login: t(locale, 'nav.login'),
      startTrial: t(locale, 'nav.startTrial'),
      comingSoon: t(locale, 'nav.comingSoon'),
    },
    solutionLabels: {
      sharedInbox: sol('sharedInbox'),
      aiSalesAgent: sol('aiSalesAgent'),
      chatbot: sol('chatbot'),
      crm: sol('crm'),
      integrations: sol('integrations'),
      campaigns: sol('campaigns'),
    },
    toolLabels: {
      chatLink: tool('chatLink'),
      qrCode: tool('qrCode'),
      chatWidget: tool('chatWidget'),
      templateChecker: tool('templateChecker'),
      pricingCalculator: tool('pricingCalculator'),
    },
    resourceLabels: {
      blog: t(locale, 'nav.resource.blog'),
      informationCenter: t(locale, 'nav.resource.informationCenter'),
    },
    footer: {
      tagline: t(locale, 'footer.tagline'),
      solutionsTitle: t(locale, 'footer.solutionsTitle'),
      toolsTitle: t(locale, 'footer.toolsTitle'),
      resourcesTitle: t(locale, 'footer.resourcesTitle'),
      legalTitle: t(locale, 'footer.legalTitle'),
      companyId: t(locale, 'footer.companyId'),
      rights: t(locale, 'footer.rights'),
      legalLabels: {
        privacy: t(locale, 'footer.legal.privacy'),
        terms: t(locale, 'footer.legal.terms'),
        dpa: t(locale, 'footer.legal.dpa'),
        dataDeletion: t(locale, 'footer.legal.dataDeletion'),
        accessibility: t(locale, 'footer.legal.accessibility'),
        security: t(locale, 'footer.legal.security'),
      },
    },
    site: {
      supportEmail: 'office@weiz.co.il',
      appUrl: 'https://app.weiz.chat',
      legalName: '__LEGAL_NAME__',
      companyId: '__COMPANY_ID__',
      address: '__ADDRESS__',
      phone: '__PHONE__',
    },
    shared: {
      ctaTrial: t(locale, 'solutions.common.ctaTrial'),
      ctaDemo: t(locale, 'solutions.common.ctaDemo'),
      comingSoon: t(locale, 'solutions.common.comingSoon'),
      solutionsCloser: t(locale, 'solutions.common.closerTitle'),
      waitlistTitle: t(locale, 'solutions.common.waitlistTitle'),
      waitlistBody: t(locale, 'solutions.common.waitlistBody'),
      waitlistCta: t(locale, 'solutions.common.waitlistCta'),
      waitlistNote: t(locale, 'solutions.common.waitlistNote'),
      waitlistSuccess: t(locale, 'solutions.common.waitlistSuccess'),
      waitlistError: t(locale, 'solutions.common.waitlistError'),
      waitlistSubject: t(locale, 'solutions.common.waitlistSubject'),
      waitlistEmailLabel: t(locale, 'solutions.common.waitlistEmailLabel'),
      waitlistEmailBody: t(locale, 'solutions.common.waitlistEmailBody'),
      toolsKicker: t(locale, 'tools.common.kicker'),
      toolsPrivacy: t(locale, 'tools.common.privacy'),
      toolsCloserTitle: t(locale, 'tools.common.closerTitle'),
      toolsCloserSub: t(locale, 'tools.common.closerSub'),
    },
  };
}

// ── Posts (the MDX articles remain the built-in corpus) ─────────────────────

export function mdxPostFiles(collection: 'blog' | 'information-center'): string[] {
  const dir = path.join(process.cwd(), 'src', 'content', 'articles', collection);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')) : [];
}

export function mdxPostDefault(
  collection: 'blog' | 'information-center',
  slug: string,
  locale: string,
): PostDoc | null {
  const file = path.join(process.cwd(), 'src', 'content', 'articles', collection, `${slug}.${locale}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!match) return null;
  const head: Record<string, string> = {};
  for (const line of match[1]!.split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) head[kv[1]!] = kv[2]!;
  }
  if (!head.title || !head.description || !head.date) return null;
  return {
    title: head.title,
    description: head.description,
    date: head.date.slice(0, 10),
    tags: [],
    image: null,
    body: match[2]!.trim(),
  };
}
