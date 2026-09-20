import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { addOns, currency } from '../../../content/pricing';
import { PlanCards } from '../../../components/pricing/plan-cards';
import { CompareTable } from '../../../components/pricing/compare-table';
import { getPageDoc } from '../../../cms/load';
import type { PricingDoc } from '../../../cms/site-schema';
import { CmsCta } from '../../../components/sections/cms-link';
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
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <h1 className="max-w-2xl text-4xl sm:text-5xl">{doc.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{doc.sub}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <PlanCards
          mostPopular={doc.mostPopular}
          getStartedHref={doc.ctaTrial.href}
          contactHref={doc.ctaContact.href}
          locale={locale}
        />

        {/* Rule 0.1-adjacent honesty: Meta's fees are not ours. */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <p className="rounded-card border border-border bg-accent-soft/40 p-5 font-medium">
            {doc.metaNote}
          </p>
          <p className="rounded-card border border-border bg-surface p-5 text-muted">
            {doc.paymentsNote}
          </p>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl sm:text-3xl">{t('addOns.title')}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t('addOns.body')}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {shownAddOns.map((addOn) => (
              <li key={addOn.id} className="rounded-card border border-border bg-surface p-5">
                <p className="font-semibold">{t(`addOns.item.${addOn.id}.name`)}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums">
                  <span dir="ltr">{money.format(addOn.unit_cents / 100)}</span>{' '}
                  <span className="text-sm font-normal text-muted">{t('card.perMonth')}</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {t(`addOns.item.${addOn.id}.unit`, { size: nf.format(addOn.unit_size) })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl sm:text-3xl">{t('compare.title')}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t('compare.body')}</p>
          <div className="mt-8">
            <CompareTable locale={locale} />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl sm:text-3xl">{doc.includedTitle}</h2>
          <p className="mt-3 max-w-2xl text-muted">{doc.includedBody}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {doc.included.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-card border border-border bg-bg px-4 py-3">
                <svg viewBox="0 0 20 20" width={16} height={16} aria-hidden="true" className="shrink-0 text-ok">
                  <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <h2 className="text-2xl sm:text-3xl">{doc.faqTitle}</h2>
        <dl className="mt-8 divide-y divide-border">
          {doc.faq.map((item) => (
            <div key={item.id} className="py-5">
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-2 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <CmsCta
            link={doc.ctaTrial}
            className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-fg hover:bg-accent-hover"
          />
          <CmsCta
            link={doc.ctaContact}
            className="rounded-full border border-border-strong px-6 py-3 font-semibold text-fg hover:border-accent hover:text-accent"
          />
        </div>
      </section>
    </main>
  );
}
