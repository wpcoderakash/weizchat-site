import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '../../i18n/navigation';
import { getGlobal, getPageDoc } from '../../cms/load';
import type { SolutionDoc } from '../../cms/site-schema';
import { metaFromSeo } from '../../lib/seo';
import { WaitlistCta } from './waitlist-cta';

/**
 * One template for every solution page (brief §4), fed by its CMS
 * document. Markup is unchanged from the i18n version — only the source
 * of the words moved. A comingSoon page shows the waitlist and never a
 * signup CTA; that behavior is content now, not configuration.
 */
export function makeSolutionPage(slug: string) {
  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const doc = await getPageDoc<SolutionDoc>(slug, locale);
    return metaFromSeo(doc.seo, `/${slug}`, locale);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const [doc, g] = await Promise.all([getPageDoc<SolutionDoc>(slug, locale), getGlobal(locale)]);

    return (
      <main>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
            <p className="flex items-center gap-3 font-mono text-sm font-semibold uppercase tracking-wide text-accent">
              {doc.kicker}
              {doc.comingSoon ? (
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs normal-case tracking-normal">
                  {g.shared.comingSoon}
                </span>
              ) : null}
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">{doc.title}</h1>
            <p className="mt-5 max-w-2xl text-lg text-muted">{doc.sub}</p>
            {doc.comingSoon ? null : (
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`${g.site.appUrl}/login`}
                  className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-fg hover:bg-accent-hover"
                >
                  {g.shared.ctaTrial}
                </a>
                <Link
                  href="/contact"
                  className="rounded-full border border-border-strong px-6 py-3 font-semibold text-fg hover:border-accent hover:text-accent"
                >
                  {g.shared.ctaDemo}
                </Link>
              </div>
            )}
          </div>
        </section>

        {doc.image && !doc.comingSoon ? (
          <section className="mx-auto max-w-5xl px-6 pt-14">
            <div className="overflow-hidden rounded-card border border-border shadow-lg">
              {/* Real product screenshot — fixture data, masked numbers. */}
              <Image
                src={doc.image.src}
                alt={doc.image.alt}
                width={2200}
                height={1375}
                sizes="(min-width: 1024px) 920px, 100vw"
              />
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doc.features.map((feature) => (
              <div key={feature.id} className="rounded-card border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
          {doc.honest ? (
            <p className="mt-8 max-w-2xl rounded-card border border-border bg-accent-soft/40 p-4 font-medium">
              {doc.honest}
            </p>
          ) : null}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          {doc.comingSoon ? (
            <WaitlistCta
              locale={locale}
              email={g.site.supportEmail}
              strings={{
                title: g.shared.waitlistTitle,
                body: g.shared.waitlistBody,
                cta: g.shared.waitlistCta,
                note: g.shared.waitlistNote,
                success: g.shared.waitlistSuccess,
                error: g.shared.waitlistError,
                subject: g.shared.waitlistSubject,
                emailLabel: g.shared.waitlistEmailLabel,
                emailBody: g.shared.waitlistEmailBody,
              }}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-accent px-8 py-8 text-accent-fg">
              <p className="text-xl font-semibold">{g.shared.solutionsCloser}</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${g.site.appUrl}/login`}
                  className="rounded-full bg-surface px-5 py-2.5 font-semibold text-accent hover:opacity-90"
                >
                  {g.shared.ctaTrial}
                </a>
                <Link
                  href="/contact"
                  className="rounded-full border border-current px-5 py-2.5 font-semibold hover:opacity-80"
                >
                  {g.shared.ctaDemo}
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  return { generateMetadata, Page };
}
