import type { LandingPage } from '../schema';

/**
 * The English landing page, as content (ADR-0032).
 *
 * Migrated verbatim from messages/en.json `home.*` — the page renders
 * identically. This file is the fallback the site ships with; once the
 * platform CMS holds a published version, that wins and this stays as the
 * answer to "what if the CMS is unreachable".
 */
export const homeEN: LandingPage = {
  slug: 'home',
  locale: 'en',
  published: true,
  seo: {
    title: 'WeizChat — the shared WhatsApp inbox with an AI sales agent',
    description: 'One team inbox for business WhatsApp, an AI agent that quotes real catalog prices, chatbot and automation — on Meta\'s official Cloud API.',
  },
  sections: [
    {
      id: 'hero',
      visible: true,
      title: 'No WhatsApp customer left waiting.',
      sub: 'WeizChat is a shared WhatsApp inbox for your whole team, with Weizic — an AI agent that answers instantly, quotes real prices from your catalog, and hands over to a human whenever needed.',
      primary: { label: 'Start free trial', href: 'https://app.weiz.chat/login', newTab: false, enabled: true },
      secondary: { label: 'Book a demo', href: '/contact', newTab: false, enabled: true },
      image: { src: '/product/inbox-chat.png', alt: 'The real WeizChat inbox: a team conversation list and an open WhatsApp chat with the customer panel.' },
    },
    {
      id: 'trust',
      visible: true,
      label: 'Product facts',
      facts: [
        { id: 'cloudApi', text: 'Built on the official WhatsApp Business Platform (Cloud API)' },
        { id: 'ownWaba', text: 'You connect your own WhatsApp Business Account — it stays yours' },
        { id: 'trilingual', text: 'Full support in Hebrew and English' },
        { id: 'humanControl', text: 'A human can take over any conversation, at any moment' },
      ],
      techProvider: 'Meta-approved Tech Provider',
      businessPartner: 'Meta Business Partner',
    },
    {
      id: 'problem',
      visible: true,
      title: 'Business WhatsApp without a system is chaos.',
      items: [
        { id: 'scattered', title: 'Scattered conversations', body: 'Customers write to employees\' personal phones — the business never sees the conversation.' },
        { id: 'noHistory', title: 'No ownership, no history', body: 'When an agent leaves, their chats, contacts and open deals leave with them.' },
        { id: 'waiting', title: 'Customers wait for hours', body: 'By the time someone answers, the customer has already bought somewhere else.' },
      ],
    },
    {
      id: 'pillars',
      visible: true,
      title: 'One platform, three jobs',
      linkLabel: 'Learn more',
      items: [
        { id: 'inbox', title: 'Shared team inbox', body: 'Every conversation in one place — assignments, statuses and internal notes. Each agent sees exactly what they need.', href: '/shared-inbox', icon: 'inbox' },
        { id: 'ai', title: 'AI sales agent', body: 'Weizic answers instantly, identifies products, quotes real catalog prices — and knows when to hand over to a person.', href: '/ai-sales-agent', icon: 'ai' },
        { id: 'bot', title: 'Chatbot & automation', body: 'After-hours replies, routing and lifecycle automations — without losing the human touch.', href: '/chatbot', icon: 'bot' },
      ],
    },
    {
      id: 'ai',
      visible: true,
      kicker: 'Our signature',
      title: 'From a photo to a quote — on its own.',
      steps: [
        { id: 'photo', title: 'A customer sends a photo or serial', body: 'A picture of a product, a model name or a serial number — the way customers actually write.' },
        { id: 'research', title: 'Weizic finds the exact model', body: 'The AI researches your own catalog to match the exact product.' },
        { id: 'answer', title: 'Real price, real stock', body: 'The reply carries product, SKU, price and stock from your data. Weizic never invents a price.' },
        { id: 'escalate', title: 'Not sure? A human steps in', body: 'Low confidence or a sensitive request — the conversation escalates to your team with full context.' },
      ],
      honest: 'A human agent can take over any conversation, at any moment. Always.',
    },
    {
      id: 'platform',
      visible: true,
      title: 'Built on the official platform',
      body: 'WeizChat works with Meta\'s WhatsApp Business Platform (Cloud API) — no workarounds, no risk to your number.',
      link: { label: 'Visit the information center', href: '/information-center', newTab: false, enabled: true },
      cards: [
        { id: 'cloudApi', title: 'Official Cloud API', body: 'The connection runs through Meta\'s official API, with a WhatsApp Business Account you own.' },
        { id: 'templates', title: 'Template messages', body: 'Reaching out first happens with message templates approved by Meta in advance.' },
        { id: 'optIn', title: 'Opt-in first', body: 'Messages go only to customers who agreed to hear from you — WhatsApp policy, and good business.' },
        { id: 'greenTick', title: 'Verified business', body: 'Businesses that meet Meta\'s criteria can apply for the official verified badge.' },
        { id: 'pricing', title: 'Conversation-based pricing', body: 'Meta bills per conversation, separately from your subscription. We explain exactly how it works.' },
      ],
    },
    {
      id: 'useCases',
      visible: true,
      title: 'How teams use it',
      tabs: [
        { id: 'service', label: 'Customer service', points: ['Every incoming question lands in one queue and is assigned to an available agent.', 'Weizic answers the routine ones — opening hours, order status, return policy.', 'Internal notes on every conversation, invisible to the customer.'] },
        { id: 'sales', label: 'Sales', points: ['A customer asks about a product — Weizic identifies it and quotes the catalog price.', 'Complex deals escalate to a salesperson with the full conversation history.', 'No lead disappears: every conversation is on the customer\'s card.'] },
        { id: 'marketing', label: 'Marketing', points: ['Campaigns with approved templates, sent to audiences filtered by tags.', 'Honest measurement: sent, delivered, read, replied.', 'A campaign reply lands straight in the shared inbox as a live conversation.'] },
      ],
    },
    {
      id: 'crm',
      visible: true,
      title: 'A simple CRM, already inside',
      body: 'No extra system to buy: every customer gets a card with everything that matters.',
      link: { label: 'More about the CRM', href: '/crm', newTab: false, enabled: true },
      features: [
        { id: 'card', text: 'Full customer card' },
        { id: 'fields', text: 'Custom fields' },
        { id: 'tags', text: 'Tags & filtering' },
        { id: 'notes', text: 'Team notes' },
        { id: 'history', text: 'Complete conversation history' },
      ],
    },
    {
      id: 'testimonials',
      visible: true,
      title: 'What customers say',
      // Empty until real, written-consent entries exist (brief rule 0.2).
      items: [],
    },
    {
      id: 'pricing',
      visible: true,
      title: 'Pricing',
      perMonth: 'month',
      metaNote: 'On top of your subscription, Meta charges separately for conversations at its official rates. There are no hidden message fees from us.',
      cta: { label: 'See full pricing', href: '/pricing', newTab: false, enabled: true },
    },
    {
      id: 'faq',
      visible: true,
      title: 'Frequently asked questions',
      items: [
        { id: 'waba', q: 'Do I need my own WhatsApp Business Account?', a: 'Yes. You connect a WhatsApp Business Account (WABA) that belongs to you — it stays yours, and we guide you through the setup.' },
        { id: 'charges', q: 'Who charges me for messages?', a: 'Meta bills conversation fees directly at its official rates. Your WeizChat subscription is separate and does not include Meta\'s charges.' },
        { id: 'keepNumber', q: 'Can I keep my existing number?', a: 'In most cases, yes. A number currently used in the WhatsApp app goes through a migration to the Business Platform — we walk you through it step by step.' },
        { id: 'data', q: 'What happens to my data?', a: 'Your data is isolated per organization, never sold, and deleted on request. The details are in our privacy policy and data deletion pages.' },
        { id: 'aiSafety', q: 'Can the AI say something wrong to my customers?', a: 'Weizic follows the rules and catalog you define, never invents a price, and asks or escalates when unsure. You can also switch it to draft-only mode, where a human approves every reply.' },
      ],
    },
    {
      id: 'finalCta',
      visible: true,
      title: 'See it answer on your own number.',
      sub: 'Connect your WhatsApp Business Account and watch Weizic handle real conversations — with your team in control.',
      primary: { label: 'Start free trial', href: 'https://app.weiz.chat/login', newTab: false, enabled: true },
      secondary: { label: 'Book a demo', href: '/contact', newTab: false, enabled: true },
    },
  ],
};
