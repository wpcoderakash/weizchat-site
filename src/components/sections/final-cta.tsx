import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { site } from '../../config/site';

/** §5.13 — the closing ask. */
export function FinalCta() {
  const t = useTranslations('home.finalCta');

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <div className="rounded-card bg-accent px-8 py-12 text-accent-fg lg:px-14">
        <h2 className="max-w-2xl text-3xl sm:text-4xl">{t('title')}</h2>
        <p className="mt-4 max-w-xl text-lg">{t('sub')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`${site.appUrl}/login`}
            className="rounded-full bg-surface px-6 py-3 font-semibold text-accent hover:opacity-90"
          >
            {t('ctaTrial')}
          </a>
          <Link
            href="/contact"
            className="rounded-full border border-current px-6 py-3 font-semibold hover:opacity-80"
          >
            {t('ctaDemo')}
          </Link>
        </div>
      </div>
    </section>
  );
}
