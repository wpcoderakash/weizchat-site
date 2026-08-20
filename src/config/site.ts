/**
 * The single source of site-wide truth (brief §0.2, §0.5, §10).
 *
 * Placeholders marked __LIKE_THIS__ are deliberate: rule §10 forbids
 * inventing legal details. The build surfaces them; they must be replaced
 * before launch.
 */
export const site = {
  name: 'WeizChat',
  domain: 'weiz.chat',
  url: 'https://weiz.chat',
  appUrl: 'https://app.weiz.chat',
  supportEmail: 'office@weiz.co.il',

  /**
   * Meta partner status — rule §0.2. Stays 'none' until Meta approves us.
   * No badge asset may render unless this flag is flipped by hand, after
   * approval. 'none' renders only factual statements in <TrustStrip />.
   */
  metaPartnerStatus: 'none' as 'none' | 'tech-provider' | 'business-partner',

  /**
   * Domain verification tag content — env-supplied, never hardcoded,
   * never invented (rule §0.5.9). Empty string renders no tag.
   */
  metaDomainVerification: process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION ?? '',

  legal: {
    /** TODO(§10): real legal entity details before launch. */
    companyName: '__LEGAL_NAME__',
    companyId: '__COMPANY_ID__',
    address: '__ADDRESS__',
    phone: '__PHONE__',
  },
} as const;
