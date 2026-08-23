import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPageDoc } from '../../cms/load';
import type { LegalDoc } from '../../cms/site-schema';
import { metaFromSeo } from '../../lib/seo';

/**
 * Legal pages (brief §0.5): permanent paths, and a body that is one
 * markdown document a lawyer edits whole — now through the CMS, with the
 * shipped MDX files as the built-in fallback.
 *
 * The lawyer-review notice stays in CODE, not in the document: it must be
 * impossible to delete from the editor until counsel actually signs off,
 * at which point removing it is a deliberate one-line change here.
 */
export type LegalSlug =
  | 'privacy-policy'
  | 'terms'
  | 'dpa'
  | 'accessibility'
  | 'data-deletion'
  | 'security';

/** The draft date of the current built-in text, shown as "last updated". */
const UPDATED = '2026-08-20';

export function makeLegalPage(slug: LegalSlug, _titleKey: string) {
  void _titleKey;

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const doc = await getPageDoc<LegalDoc>(slug, locale);
    return metaFromSeo(doc.seo, `/${slug}`, locale);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const doc = await getPageDoc<LegalDoc>(slug, locale);
    const t = await getTranslations({ locale, namespace: 'legal' });

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
          <MDXRemote
            source={doc.body}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </article>
        <p className="mt-10 border-t border-border pt-4 text-sm text-muted">
          {t('updated')}: {UPDATED}
        </p>
      </main>
    );
  }

  return { generateMetadata, Page };
}
