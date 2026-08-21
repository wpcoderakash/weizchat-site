import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../i18n/navigation';
import { site } from '../../config/site';
import { articleParams, getArticle, type Collection } from '../../lib/articles';
import { alternatesFor, openGraphLocale } from '../../lib/seo';

/**
 * A single article. MDX is compiled at build time from the file body, so
 * writing content never means touching code. Emits Article JSON-LD, and
 * hreflang pointing at the same slug in the other locale.
 */
export function makeArticlePage(collection: Collection, nsKey: string) {
  const base = collection === 'blog' ? '/blog' : '/information-center';

  function generateStaticParams() {
    return articleParams(collection);
  }

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string; slug: string }>;
  }): Promise<Metadata> {
    const { locale, slug } = await params;
    const article = getArticle(collection, slug, locale);
    if (!article) return {};
    return {
      title: article.title,
      description: article.description,
      alternates: alternatesFor(`${base}/${slug}`),
      openGraph: {
        type: 'article',
        title: article.title,
        description: article.description,
        publishedTime: article.date,
        ...openGraphLocale(locale),
      },
    };
  }

  async function Page({
    params,
  }: {
    params: Promise<{ locale: string; slug: string }>;
  }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const article = getArticle(collection, slug, locale);
    if (!article) notFound();

    const t = await getTranslations({ locale, namespace: 'articles.common' });
    const tIndex = await getTranslations({ locale, namespace: `articles.${nsKey}` });
    const df = new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      datePublished: article.date,
      dateModified: article.date,
      inLanguage: locale,
      author: { '@type': 'Organization', name: site.name },
      publisher: { '@type': 'Organization', name: site.name },
      mainEntityOfPage: `${site.url}${locale === 'he' ? '' : `/${locale}`}${base}/${slug}`,
    };

    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">
          <Link href={base} className="text-accent hover:text-accent-hover">
            {tIndex('title')}
          </Link>
        </p>
        <h1 className="mt-4 text-4xl">{article.title}</h1>
        <p className="mt-3 text-lg text-muted">{article.description}</p>
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-muted">
          <time dateTime={article.date}>{df.format(new Date(article.date))}</time>
          {' · '}
          {t('readingTime', { minutes: article.readingMinutes })}
        </p>

        <article className="legal-prose mt-10">
          <MDXRemote
            source={article.body}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </article>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-card bg-accent px-6 py-6 text-accent-fg">
          <p className="font-semibold">{t('ctaTitle')}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`${site.appUrl}/login`}
              className="rounded-full bg-surface px-5 py-2.5 font-semibold text-accent hover:opacity-90"
            >
              {t('ctaTrial')}
            </a>
            <Link
              href="/contact"
              className="rounded-full border border-current px-5 py-2.5 font-semibold hover:opacity-80"
            >
              {t('ctaDemo')}
            </Link>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </main>
    );
  }

  return { generateStaticParams, generateMetadata, Page };
}
