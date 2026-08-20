import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { pricingTiers } from '../../content/pricing';

/**
 * §5.11 — pricing preview. Tier names/amounts are SECTION-10 placeholders
 * until the owner supplies them; the Meta-charges-separately note is real
 * and mandatory.
 */
export function PricingPreview() {
  const t = useTranslations('home.pricing');

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="text-3xl sm:text-4xl">{t('title')}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-card border bg-surface p-6 ${
              tier.featured ? 'border-accent shadow-md' : 'border-border'
            }`}
          >
            <h3 className="font-semibold">{tier.name}</h3>
            <p className="mt-3 font-mono text-3xl font-semibold">
              {tier.monthlyPrice}
              <span className="text-sm font-normal text-muted"> / {t('perMonth')}</span>
            </p>
            <p className="mt-3 text-sm text-muted">{tier.summary}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-sm text-muted">{t('metaNote')}</p>
      <Link href="/pricing" className="mt-4 inline-block font-semibold text-accent hover:text-accent-hover">
        {t('cta')}
      </Link>
    </section>
  );
}
