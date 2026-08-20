import { useTranslations } from 'next-intl';

/**
 * The signature section (§5.6): the real Weizic flow — photo/serial in,
 * catalog research, real price and stock out, low-confidence escalation.
 * Every claim here matches how the product actually behaves; the honest
 * human-takeover note is part of the spec, not small print.
 */
export function AiDeepDive() {
  const t = useTranslations('home.ai');
  const steps = ['photo', 'research', 'answer', 'escalate'] as const;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <p className="font-mono text-sm font-semibold uppercase tracking-wide text-accent">
        {t('kicker')}
      </p>
      <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">{t('title')}</h2>

      <div className="relative mt-12">
        {/* The Bolt Path — the W's zigzag connecting the four steps. */}
        <svg
          aria-hidden="true"
          className="absolute inset-x-0 top-10 hidden h-8 w-full text-accent-soft lg:block"
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,30 190,10 380,30 570,10 760,30 1000,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
        <ol className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((key, index) => (
            <li key={key} className="rounded-card border border-border bg-surface p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent font-mono text-sm font-semibold text-accent-fg">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-muted">{t(`${key}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-8 max-w-2xl rounded-card border border-border bg-accent-soft/40 p-4 font-medium">
        {t('honest')}
      </p>
    </section>
  );
}
