import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { docStatus } from '../../cms/docs';
import { getPageDoc } from '../../cms/load';
import { legalDocSchema, type LegalDoc } from '../../cms/site-schema';
import { metaFromSeo } from '../../lib/seo';

/**
 * Legal pages (brief §0.5): permanent paths, and a body that is one
 * markdown document a lawyer edits whole — now through the CMS, with the
 * shipped MDX files as the built-in fallback.
 *
 * The lawyer-review notice stays in CODE, not in the document: it must be
 * impossible to delete from the editor until counsel actually signs off,
 * at which point removing it is a deliberate change here.
 *
 * It is per-document rather than global, because sign-off arrives that way.
 * Clearing it for every page at once would put a reviewed stamp on
 * documents that still show `__LEGAL_NAME__` to visitors.
 */
export type LegalSlug =
  | 'privacy-policy'
  | 'terms'
  | 'dpa'
  | 'accessibility'
  | 'data-deletion'
  | 'security';

/**
 * The date the SHIPPED text was drafted. Only used for a document nobody has
 * republished through the CMS.
 */
const BUILT_IN_UPDATED = '2026-08-20';

/**
 * When this document was last actually changed.
 *
 * It used to be one hardcoded constant on every legal page, which meant all
 * six claimed the same date no matter when each was really edited — and kept
 * claiming it after the owner republished two of them. The store already
 * records a real timestamp per document per locale; use that, and fall back
 * to the built-in date only when nothing has been published.
 */
function lastUpdated(slug: LegalSlug, locale: string): string {
  const stamp = docStatus(legalDocSchema, 'page', slug, locale).updatedAt;
  if (!stamp) return BUILT_IN_UPDATED;
  const at = new Date(stamp);
  return Number.isNaN(at.getTime()) ? BUILT_IN_UPDATED : at.toISOString().slice(0, 10);
}

/**
 * Documents whose text the owner has had reviewed and replaced (2026-08-26).
 *
 * Add a slug here only when its real text is published — not when it is
 * merely written. Everything absent still renders the review warning.
 */
const REVIEWED: ReadonlySet<LegalSlug> = new Set<LegalSlug>(['terms', 'privacy-policy']);

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
        {/* Brief §9.5: visible until a lawyer approves THIS document. */}
        {REVIEWED.has(slug) ? null : (
          <div
            role="note"
            className="mb-8 rounded-card border border-warn/40 bg-warn/10 p-4 text-sm font-medium text-warn"
          >
            {t('lawyerNotice')}
          </div>
        )}
        <article className="legal-prose">
          <MDXRemote
            source={doc.body}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </article>
        <p className="mt-10 border-t border-border pt-4 text-sm text-muted">
          {t('updated')}: {lastUpdated(slug, locale)}
        </p>
      </main>
    );
  }

  return { generateMetadata, Page };
}
