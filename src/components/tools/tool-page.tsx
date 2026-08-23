import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '../../i18n/navigation';
import { tools, type ToolSlug } from '../../config/tools';
import { getGlobal, getPageDoc } from '../../cms/load';
import type { ToolDoc } from '../../cms/site-schema';
import { metaFromSeo } from '../../lib/seo';
import { ChatLinkGenerator } from './chat-link-generator';
import { QrCodeGenerator } from './qr-code-generator';
import { ChatWidgetGenerator } from './chat-widget-generator';
import { TemplateChecker } from './template-checker';
import { PricingCalculator } from './pricing-calculator';

/**
 * Shared shell for the five free tools (brief §4): SEO landing page + the
 * tool itself + a privacy line that is literally true — these run in the
 * browser and this site has no backend to store anything in.
 */
const WIDGETS: Record<ToolSlug, () => React.ReactElement> = {
  'chat-link-generator': ChatLinkGenerator,
  'qr-code-generator': QrCodeGenerator,
  'chat-widget-generator': ChatWidgetGenerator,
  'template-checker': TemplateChecker,
  'conversation-pricing-calculator': PricingCalculator,
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
    const [doc, g] = await Promise.all([getPageDoc<ToolDoc>(slug, locale), getGlobal(locale)]);

    return (
      <main>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
            <p className="font-mono text-sm font-semibold uppercase tracking-wide text-accent">
              {g.shared.toolsKicker}
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">{doc.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{doc.sub}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <Widget />
          <p className="mt-6 max-w-2xl rounded-card border border-border bg-accent-soft/40 p-4 text-sm font-medium">
            {g.shared.toolsPrivacy}
          </p>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="text-2xl">{doc.howTitle}</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {doc.how.map((step, i) => (
                <li key={step} className="rounded-card border border-border bg-bg p-5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-accent font-mono text-sm font-semibold text-accent-fg">
                    {i + 1}
                  </span>
                  <p className="mt-3">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-accent px-8 py-8 text-accent-fg">
            <div>
              <p className="text-xl font-semibold">{g.shared.toolsCloserTitle}</p>
              <p className="mt-1">{g.shared.toolsCloserSub}</p>
            </div>
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
        </section>
      </main>
    );
  }

  return { generateMetadata, Page };
}
