import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../i18n/navigation';
import { listArticles, type Collection } from '../../lib/articles';
import { alternatesFor, openGraphLocale } from '../../lib/seo';

/**
 * Index page for a collection. Renders a real empty state when nothing is
 * published in this locale yet — never a fake "coming soon" grid.
 */
export function makeArticleIndex(collection: Collection, nsKey: string) {
  const ns = `articles.${nsKey}`;
  const base = collection === 'blog' ? '/blog' : '/information-center';

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: ns });
    return {
      title: t('metaTitle'),
      description: t('metaDescription'),
      alternates: alternatesFor(base),
      openGraph: {
        title: t('metaTitle'),
        description: t('metaDescription'),
        ...openGraphLocale(locale),
      },
    };
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: ns });
    const tc = await getTranslations({ locale, namespace: 'articles.common' });
    const articles = listArticles(collection, locale);
    const df = new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <main>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-4xl px-6 py-14 lg:py-16">
            <h1 className="text-4xl sm:text-5xl">{t('title')}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{t('sub')}</p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12">
          {articles.length === 0 ? (
            <div className="rounded-card border border-dashed border-border-strong bg-surface p-10 text-center">
              <p className="font-semibold">{tc('emptyTitle')}</p>
              <p className="mt-2 text-muted">{tc('emptyBody')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {articles.map((article) => (
                <li key={article.slug} className="py-6">
                  <Link href={`${base}/${article.slug}`} className="group block">
                    <h2 className="text-2xl font-semibold group-hover:text-accent">
                      {article.title}
                    </h2>
                    <p className="mt-2 text-muted">{article.description}</p>
                    <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted">
                      <time dateTime={article.date}>{df.format(new Date(article.date))}</time>
                      {' · '}
                      {tc('readingTime', { minutes: article.readingMinutes })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    );
  }

  return { generateMetadata, Page };
}
