/**
 * Solution pages (brief §4): one convertible landing page per feature.
 * `image` names a file under public/product/ — every visual is a real
 * screenshot of the running product (fixture data, masked numbers).
 * `campaigns` is comingSoon per the brief: waitlist, no signup CTA, and
 * deliberately no screenshot — a working screenshot under a "coming soon"
 * headline would contradict itself.
 */
export interface SolutionConfig {
  slug: string;
  /** messages key under `solutions.` */
  key: string;
  image: string | null;
  featureCount: number;
  hasHonestNote: boolean;
  comingSoon?: boolean;
}

export const solutions: readonly SolutionConfig[] = [
  { slug: 'shared-inbox', key: 'sharedInbox', image: 'inbox-chat.png', featureCount: 6, hasHonestNote: false },
  { slug: 'ai-sales-agent', key: 'aiSalesAgent', image: 'ai-agent.png', featureCount: 6, hasHonestNote: true },
  { slug: 'chatbot', key: 'chatbot', image: 'chatbot.png', featureCount: 6, hasHonestNote: true },
  { slug: 'crm', key: 'crm', image: 'customers.png', featureCount: 6, hasHonestNote: false },
  { slug: 'integrations', key: 'integrations', image: 'whatsapp.png', featureCount: 5, hasHonestNote: true },
  { slug: 'campaigns', key: 'campaigns', image: null, featureCount: 4, hasHonestNote: false, comingSoon: true },
];
