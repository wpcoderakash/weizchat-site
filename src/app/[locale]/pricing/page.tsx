import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { addOns, currency } from '../../../content/pricing';
import { PlanCards } from '../../../components/pricing/plan-cards';
import { CompareTable } from '../../../components/pricing/compare-table';
import { getPageDoc } from '../../../cms/load';
import type { PricingDoc } from '../../../cms/site-schema';
import { CmsCta } from '../../../components/sections/cms-link';
import { Arrow } from '../../../components/ui/arrow';
import { metaFromSeo } from '../../../lib/seo';

/**
 * /pricing — a VIEW of the app's published price list (app ADR-0061).
 *
 * Plans, prices, limits, add-ons and the feature list all come from
 * `content/plan-catalogue.json`, a snapshot the release script compares with
 * the live app. Nothing on this page is typed in here, and nothing is computed
 * here: the price for a team size is looked up in a published table.
 *
 * Two honesty rules the page must never lose: Meta bills conversations
 * separately, and self-serve payment does not exist yet (DR-14) — so a plan's
 * button opens registration (which creates a workspace that is not yet
 * subscribed) and never pretends to be a checkout or a free trial.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const doc = await getPageDoc<PricingDoc>('pricing', locale);
  return metaFromSeo(doc.seo, '/pricing', locale);
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = await getPageDoc<PricingDoc>('pricing', locale);
  // Tier NAMES stay in the product's own vocabulary (ADR-0032) — they
  // mirror the code-owned plan matrix, so they are not CMS content.
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const nf = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US');
  // The catalogue also publishes an `agent` add-on: the per-agent price for a
  // tier sold by conversation. Every priced plan shows ITS OWN per-agent price
  // on its card, so a fourth card here saying "$10" beside a Starter card
  // saying "$12" would only raise the question of which one is true.
  const shownAddOns = addOns.filter((a) => a.id !== 'agent');
  // Amounts are always written the en-US way and rendered LTR, so "$15" reads
  // the same inside a Hebrew sentence as it does in an English one.
  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  return (
    <main>
      <section className="glow-bg overflow-hidden">
        <div aria-hidden="true" className="grid-bg" />
        <div className="wrap pb-12 pt-16 text-center sm:pt-24">
          <h1 className="display-1 mx-auto max-w-3xl">{doc.title}</h1>
          <p className="lede mx-auto mt-6 max-w-2xl">{doc.sub}</p>
        </div>
      </section>

      <section className="wrap pb-20">
        <PlanCards
          mostPopular={doc.mostPopular}
          getStartedHref={doc.ctaTrial.href}
          contactHref={doc.ctaContact.href}
          locale={locale}
        />

        {/* Rule 0.1-adjacent honesty: Meta's fees are not ours. */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <p data-reveal className="flex gap-3 rounded-[var(--radius-lg)] border border-accent/20 bg-accent-soft/60 p-6 text-sm">
            <Info />
            <span>{doc.metaNote}</span>
          </p>
          <p data-reveal className="card flex gap-3 p-6 text-sm text-muted">
            <Info />
            <span>{doc.paymentsNote}</span>
          </p>
        </div>
      </section>

      <section className="section border-t border-border bg-surface">
        <div className="wrap">
          <h2 data-reveal className="display-2">{t('addOns.title')}</h2>
          <p data-reveal className="lede mt-4 max-w-2xl">{t('addOns.body')}</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {shownAddOns.map((addOn, index) => (
              <li
                key={addOn.id}
                data-reveal
                style={{ '--i': index + 1 } as React.CSSProperties}
                className="card card-hover bg-bg p-7"
              >
                <p className="font-semibold">{t(`addOns.item.${addOn.id}.name`)}</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">
                  <span dir="ltr">{money.format(addOn.unit_cents / 100)}</span>{' '}
                  <span className="text-sm font-normal text-muted">{t('card.perMonth')}</span>
                </p>
                <p className="mt-2 text-sm text-muted">
                  {t(`addOns.item.${addOn.id}.unit`, { size: nf.format(addOn.unit_size) })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-t border-border">
        <div className="wrap">
          <h2 data-reveal className="display-2">{t('compare.title')}</h2>
          <p data-reveal className="lede mt-4 max-w-2xl">{t('compare.body')}</p>
          {/* Only where the table actually scrolls. */}
          <p className="mt-3 text-sm text-muted md:hidden">{t('compare.swipe')}</p>
          <div data-reveal className="mt-10">
            <CompareTable locale={locale} />
          </div>
        </div>
      </section>

      <section className="section border-y border-border bg-surface">
        <div className="wrap">
          <h2 data-reveal className="display-2">{doc.includedTitle}</h2>
          <p data-reveal className="lede mt-4 max-w-2xl">{doc.includedBody}</p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {doc.included.map((item, index) => (
              <li
                key={item.id}
                data-reveal
                style={{ '--i': (index % 4) + 1 } as React.CSSProperties}
                className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-4 py-3.5"
              >
                <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <svg viewBox="0 0 20 20" width={14} height={14}>
                    <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 data-reveal className="display-2">{doc.faqTitle}</h2>
            <div data-reveal className="mt-8 flex flex-wrap gap-3">
              <CmsCta link={doc.ctaTrial} className="btn btn-primary">
                <Arrow />
              </CmsCta>
              <CmsCta link={doc.ctaContact} className="btn btn-secondary" />
            </div>
          </div>
          <dl data-reveal className="border-t border-border">
            {doc.faq.map((item) => (
              <div key={item.id} className="border-b border-border py-6">
                <dt className="text-lg font-medium">{item.q}</dt>
                <dd className="mt-2 max-w-2xl text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}

function Info() {
  return (
    <svg viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v5M10 6.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
