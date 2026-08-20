import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';

/**
 * §5.7 — factual Cloud API education. Doubles as reassurance for Meta
 * reviewers, so the tone is educational and every statement is checkable.
 */
export function OfficialPlatform() {
  const t = useTranslations('home.platform');
  const cards = ['cloudApi', 'templates', 'optIn', 'greenTick', 'pricing'] as const;

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <h2 className="max-w-2xl text-3xl sm:text-4xl">{t('title')}</h2>
        <p className="mt-4 max-w-2xl text-lg text-muted">{t('body')}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((key) => (
            <div key={key} className="rounded-card border border-border bg-bg p-6">
              <h3 className="font-semibold">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted">{t(`${key}.body`)}</p>
            </div>
          ))}
          <div className="flex items-center rounded-card border border-dashed border-border-strong p-6">
            <Link
              href="/information-center"
              className="font-semibold text-accent hover:text-accent-hover"
            >
              {t('link')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
