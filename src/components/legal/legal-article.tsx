import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor, openGraphLocale } from '../../lib/seo';

/**
 * Legal pages (brief §0.5): permanent paths, per-locale MDX content a
 * lawyer can edit directly, and — until that review happens — a visible
 * notice on every page. Removing the notice is a one-line change made
 * only after counsel signs off.
 */

export type LegalSlug =
  | 'privacy-policy'
  | 'terms'
  | 'dpa'
  | 'accessibility'
  | 'data-deletion'
  | 'security';

/** Explicit module map — no bundler path magic, every file accounted for. */
const CONTENT: Record<LegalSlug, Record<string, () => Promise<{ default: ComponentType }>>> = {
  'privacy-policy': {
    he: () => import('../../content/legal/privacy-policy.he.mdx'),
    en: () => import('../../content/legal/privacy-policy.en.mdx'),
  },
  terms: {
    he: () => import('../../content/legal/terms.he.mdx'),
    en: () => import('../../content/legal/terms.en.mdx'),
  },
  dpa: {
    he: () => import('../../content/legal/dpa.he.mdx'),
    en: () => import('../../content/legal/dpa.en.mdx'),
  },
  accessibility: {
    he: () => import('../../content/legal/accessibility.he.mdx'),
    en: () => import('../../content/legal/accessibility.en.mdx'),
  },
  'data-deletion': {
    he: () => import('../../content/legal/data-deletion.he.mdx'),
    en: () => import('../../content/legal/data-deletion.en.mdx'),
  },
  security: {
    he: () => import('../../content/legal/security.he.mdx'),
    en: () => import('../../content/legal/security.en.mdx'),
  },
};

/** The draft date of the current text, shown as "last updated". */
const UPDATED = '2026-08-20';

export function makeLegalPage(slug: LegalSlug, titleKey: string) {
  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'footer.legal' });
    return {
      title: t(titleKey),
      alternates: alternatesFor(`/${slug}`),
      openGraph: { title: t(titleKey), ...openGraphLocale(locale) },
    };
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'legal' });
    const load = CONTENT[slug][locale] ?? CONTENT[slug]['he'];
    const { default: Content } = await load();

    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        {/* Brief §9.5: visible until a lawyer approves the text. */}
        <div
          role="note"
          className="mb-8 rounded-card border border-warn/40 bg-warn/10 p-4 text-sm font-medium text-warn"
        >
          {t('lawyerNotice')}
        </div>
        <article className="legal-prose">
          <Content />
        </article>
        <p className="mt-10 border-t border-border pt-4 text-sm text-muted">
          {t('updated')}: {UPDATED}
        </p>
      </main>
    );
  }

  return { generateMetadata, Page };
}
