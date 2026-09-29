import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "../../i18n/navigation";
import { Arrow } from "../ui/arrow";
import { site } from "../../config/site";
import { articleParams, getArticle, type Collection } from "../../lib/articles";
import { alternatesFor, openGraphLocale } from "../../lib/seo";

/**
 * A single article. MDX is compiled at build time from the file body, so
 * writing content never means touching code. Emits Article JSON-LD, and
 * hreflang pointing at the same slug in the other locale.
 */
export function makeArticlePage(collection: Collection, nsKey: string) {
  const base = collection === "blog" ? "/blog" : "/information-center";

  function generateStaticParams() {
    return articleParams(collection);
  }

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string; slug: string }>;
  }): Promise<Metadata> {
    const { locale, slug } = await params;
    const article = await getArticle(collection, slug, locale);
    if (!article) return {};
    return {
      title: article.title,
      description: article.description,
      alternates: alternatesFor(`${base}/${slug}`),
      openGraph: {
        type: "article",
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
    const article = await getArticle(collection, slug, locale);
    if (!article) notFound();

    const t = await getTranslations({ locale, namespace: "articles.common" });
    const tIndex = await getTranslations({
      locale,
      namespace: `articles.${nsKey}`,
    });
    const df = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.date,
      dateModified: article.date,
      inLanguage: locale,
      author: { "@type": "Organization", name: site.name },
      publisher: { "@type": "Organization", name: site.name },
      mainEntityOfPage: `${site.url}${locale === "he" ? "" : `/${locale}`}${base}/${slug}`,
    };

    return (
      <main>
        <header className="glow-bg overflow-hidden">
          <div className="mx-auto max-w-3xl px-6 pb-4 pt-14 sm:pt-20">
            <Link href={base} className="eyebrow hover:text-accent">
              {tIndex("title")}
            </Link>
            <h1 className="display-2 mt-5">{article.title}</h1>
            <p className="lede mt-5">{article.description}</p>
            <p className="mt-6 border-b border-border pb-8 font-mono text-xs uppercase tracking-wide text-muted">
              <time dateTime={article.date}>
                {df.format(new Date(article.date))}
              </time>
              {" · "}
              {t("readingTime", { minutes: article.readingMinutes })}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6">
          <article className="legal-prose mt-8">
            <MDXRemote
              source={article.body}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </article>
        </div>

        <div className="wrap section-tight">
          <div data-reveal className="cta-panel px-6 py-12 text-center sm:px-12">
            <p className="display-2 mx-auto max-w-2xl">{t("ctaTitle")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={`${site.appUrl}/register`} className="btn btn-light">
                {t("ctaTrial")}
                <Arrow />
              </a>
              <Link href="/contact" className="btn btn-outline-light">
                {t("ctaDemo")}
              </Link>
            </div>
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
