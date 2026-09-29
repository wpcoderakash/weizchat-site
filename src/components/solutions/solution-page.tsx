import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "../../i18n/navigation";
import { getGlobal, getPageDoc } from "../../cms/load";
import type { SolutionDoc } from "../../cms/site-schema";
import { metaFromSeo } from "../../lib/seo";
import { WaitlistCta } from "./waitlist-cta";
import { Arrow } from "../ui/arrow";

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
    const [doc, g] = await Promise.all([
      getPageDoc<SolutionDoc>(slug, locale),
      getGlobal(locale),
    ]);

    return (
      <main>
        <section className="glow-bg overflow-hidden">
          <div aria-hidden="true" className="grid-bg" />
          <div className="wrap pb-12 pt-16 text-center sm:pt-24">
            <p className="flex flex-wrap items-center justify-center gap-3">
              <span className="eyebrow">{doc.kicker}</span>
              {doc.comingSoon ? (
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  {g.shared.comingSoon}
                </span>
              ) : null}
            </p>
            <h1 className="display-1 mx-auto mt-5 max-w-4xl">{doc.title}</h1>
            <p className="lede mx-auto mt-6 max-w-2xl">{doc.sub}</p>
            {doc.comingSoon ? null : (
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <a href={`${g.site.appUrl}/register`} className="btn btn-primary">
                  {g.shared.ctaTrial}
                  <Arrow />
                </a>
                <Link href="/contact" className="btn btn-secondary">
                  {g.shared.ctaDemo}
                </Link>
              </div>
            )}

            {doc.image && !doc.comingSoon ? (
              <div className="hero-settle mx-auto mt-14 max-w-5xl sm:mt-20">
                <div className="shot-frame text-start">
                  <div aria-hidden="true" className="shot-bar">
                    <span />
                    <span />
                    <span />
                  </div>
                  {/* Real product screenshot — fixture data, masked numbers. */}
                  <Image
                    src={doc.image.src}
                    alt={doc.image.alt}
                    width={2200}
                    height={1375}
                    priority
                    sizes="(min-width: 1100px) 1024px, 100vw"
                    className="block h-auto w-full"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section border-t border-border bg-surface">
          <div className="wrap">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {doc.features.map((feature, index) => (
                <div
                  key={feature.id}
                  data-reveal
                  style={{ '--i': (index % 3) + 1 } as React.CSSProperties}
                  className="card card-hover bg-bg p-7"
                >
                  <span aria-hidden="true" className="font-mono text-sm font-semibold text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-5 text-xl">{feature.title}</h2>
                  <p className="mt-3 text-muted">{feature.body}</p>
                </div>
              ))}
            </div>
            {doc.honest ? (
              <p
                data-reveal
                className="mt-10 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-accent/20 bg-accent-soft/60 px-5 py-4 font-medium"
              >
                <svg viewBox="0 0 20 20" width={20} height={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
                  <path d="M10 2l6 2.5v5c0 4-2.7 7-6 8.5-3.3-1.5-6-4.5-6-8.5v-5L10 2z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M7 10l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {doc.honest}
              </p>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="wrap">
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
              <div data-reveal className="cta-panel px-6 py-14 text-center sm:px-12 lg:py-20">
                <p className="display-2 mx-auto max-w-3xl">{g.shared.solutionsCloser}</p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <a href={`${g.site.appUrl}/register`} className="btn btn-light">
                    {g.shared.ctaTrial}
                    <Arrow />
                  </a>
                  <Link href="/contact" className="btn btn-outline-light">
                    {g.shared.ctaDemo}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  return { generateMetadata, Page };
}
