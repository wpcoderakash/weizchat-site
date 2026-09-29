import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "../../i18n/navigation";
import { Arrow } from '../ui/arrow';
import { tools, type ToolSlug } from "../../config/tools";
import { getGlobal, getPageDoc } from "../../cms/load";
import type { ToolDoc } from "../../cms/site-schema";
import { metaFromSeo } from "../../lib/seo";
import { ChatLinkGenerator } from "./chat-link-generator";
import { QrCodeGenerator } from "./qr-code-generator";
import { ChatWidgetGenerator } from "./chat-widget-generator";
import { TemplateChecker } from "./template-checker";
import { PricingCalculator } from "./pricing-calculator";

/**
 * Shared shell for the five free tools (brief §4): SEO landing page + the
 * tool itself + a privacy line that is literally true — these run in the
 * browser and this site has no backend to store anything in.
 */
const WIDGETS: Record<ToolSlug, () => React.ReactElement> = {
  "chat-link-generator": ChatLinkGenerator,
  "qr-code-generator": QrCodeGenerator,
  "chat-widget-generator": ChatWidgetGenerator,
  "template-checker": TemplateChecker,
  "conversation-pricing-calculator": PricingCalculator,
};

export function makeToolPage(slug: ToolSlug) {
  const config = tools.find((t) => t.slug === slug)!;
  void config;
  const Widget = WIDGETS[slug];

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const doc = await getPageDoc<ToolDoc>(slug, locale);
    return metaFromSeo(doc.seo, `/tools/${slug}`, locale);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const [doc, g] = await Promise.all([
      getPageDoc<ToolDoc>(slug, locale),
      getGlobal(locale),
    ]);

    return (
      <main>
        <section className="glow-bg overflow-hidden">
          <div aria-hidden="true" className="grid-bg" />
          <div className="wrap pb-10 pt-16 text-center sm:pt-24">
            <p className="eyebrow">{g.shared.toolsKicker}</p>
            <h1 className="display-1 mx-auto mt-5 max-w-3xl">{doc.title}</h1>
            <p className="lede mx-auto mt-6 max-w-2xl">{doc.sub}</p>
          </div>
        </section>

        <section className="wrap pb-20">
          <Widget />
          <p className="mt-8 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-accent/20 bg-accent-soft/60 px-5 py-4 text-sm font-medium">
            <svg viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
              <rect x="4" y="9" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M7 9V6.5a3 3 0 016 0V9" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {g.shared.toolsPrivacy}
          </p>
        </section>

        <section className="section border-y border-border bg-surface">
          <div className="wrap">
            <h2 data-reveal className="display-2">{doc.howTitle}</h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {doc.how.map((step, i) => (
                <li
                  key={step}
                  data-reveal
                  style={{ '--i': i + 1 } as React.CSSProperties}
                  className="card card-hover bg-bg p-7"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-accent font-mono text-sm font-semibold text-accent-fg shadow-[0_0_0_6px_var(--accent-soft)]">
                    {i + 1}
                  </span>
                  <p className="mt-5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div data-reveal className="cta-panel px-6 py-14 text-center sm:px-12 lg:py-20">
              <p className="display-2 mx-auto max-w-3xl">{g.shared.toolsCloserTitle}</p>
              <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">{g.shared.toolsCloserSub}</p>
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
          </div>
        </section>
      </main>
    );
  }

  return { generateMetadata, Page };
}
