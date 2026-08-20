import { useTranslations } from 'next-intl';

/** The problem (§5.4): three real pains, no invented numbers. */
export function Problem() {
  const t = useTranslations('home.problem');
  const items = ['scattered', 'noHistory', 'waiting'] as const;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <h2 className="max-w-2xl text-3xl sm:text-4xl">{t('title')}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {items.map((key) => (
          <div key={key} className="rounded-card border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold">{t(`${key}.title`)}</h3>
            <p className="mt-2 text-muted">{t(`${key}.body`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
