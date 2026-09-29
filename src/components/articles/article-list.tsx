import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../i18n/navigation';
import { Arrow } from '../ui/arrow';
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
    const articles = await listArticles(collection, locale);
    const df = new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <main>
        <section className="glow-bg overflow-hidden">
          <div aria-hidden="true" className="grid-bg" />
          <div className="wrap pb-12 pt-16 text-center sm:pt-24">
            <h1 className="display-1 mx-auto max-w-3xl">{t('title')}</h1>
            <p className="lede mx-auto mt-6 max-w-2xl">{t('sub')}</p>
          </div>
        </section>

        <section className="wrap pb-24">
          {articles.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-12 text-center">
              <p className="text-lg font-semibold">{tc('emptyTitle')}</p>
              <p className="mt-2 text-muted">{tc('emptyBody')}</p>
            </div>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2">
              {articles.map((article, index) => (
                <li
                  key={article.slug}
                  data-reveal
                  style={{ '--i': (index % 2) + 1 } as React.CSSProperties}
                >
                  <Link
                    href={`${base}/${article.slug}`}
                    className="card card-hover group flex h-full flex-col p-7"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-mono text-xs uppercase tracking-wide text-muted">
                        <time dateTime={article.date}>{df.format(new Date(article.date))}</time>
                        {' · '}
                        {tc('readingTime', { minutes: article.readingMinutes })}
                      </p>
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-accent transition-colors group-hover:border-accent group-hover:bg-accent-soft"
                      >
                        <Arrow />
                      </span>
                    </div>
                    <h2 className="mt-4 text-2xl transition-colors group-hover:text-accent">
                      {article.title}
                    </h2>
                    <p className="mt-3 flex-1 text-muted">{article.description}</p>
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
