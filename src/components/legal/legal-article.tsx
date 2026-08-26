import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPageDoc } from '../../cms/load';
import { ENGLISH_ONLY_LEGAL } from '../../config/routes';
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

  /**
   * Which language's document to read. Independent of the page's own
   * locale: an English-only document still renders inside the Hebrew site,
   * with its own `lang` and `dir` so screen readers and bidi get it right.
   */
  const contentLocale = (locale: string) =>
    ENGLISH_ONLY_LEGAL.has(slug) ? 'en' : locale;

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const doc = await getPageDoc<LegalDoc>(slug, contentLocale(locale));
    return metaFromSeo(doc.seo, `/${slug}`, locale);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const doc = await getPageDoc<LegalDoc>(slug, contentLocale(locale));
    const t = await getTranslations({ locale, namespace: 'legal' });
    const untranslated = locale !== 'en' && ENGLISH_ONLY_LEGAL.has(slug);

    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        {/* Brief §9.5: visible until a lawyer approves the text. */}
        <div
          role="note"
          className="mb-8 rounded-card border border-warn/40 bg-warn/10 p-4 text-sm font-medium text-warn"
        >
          {t('lawyerNotice')}
        </div>
        {/* Say so, rather than serving English under a Hebrew heading and
            letting the reader work it out. */}
        {untranslated ? (
          <p
            role="note"
            lang="he"
            dir="rtl"
            className="mb-8 rounded-card border border-border bg-surface-2 p-4 text-sm text-muted"
          >
            {t('englishOnly')}
          </p>
        ) : null}
        <article className="legal-prose" lang={untranslated ? 'en' : locale} dir={untranslated ? 'ltr' : undefined}>
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
