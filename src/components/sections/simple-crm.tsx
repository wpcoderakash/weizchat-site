import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';

/** §5.9 — the built-in CRM: cards, custom fields, tags, notes, history. */
export function SimpleCrm() {
  const t = useTranslations('home.crm');
  const features = ['card', 'fields', 'tags', 'notes', 'history'] as const;

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <h2 className="text-3xl sm:text-4xl">{t('title')}</h2>
          <p className="mt-4 max-w-lg text-lg text-muted">{t('body')}</p>
          <Link href="/crm" className="mt-6 inline-block font-semibold text-accent hover:text-accent-hover">
            {t('link')}
          </Link>
        </div>
        <ul className="grid gap-3 self-center">
          {features.map((key) => (
            <li key={key} className="flex items-center gap-3 rounded-card border border-border bg-bg px-5 py-3">
              <svg viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" className="shrink-0 text-ok">
                <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="font-medium">{t(`features.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
