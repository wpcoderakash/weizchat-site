'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import rateCard from '../../content/meta-rates.json';
import { Field, fieldClass } from './tool-shell';

/**
 * Conversation / per-message cost estimator.
 *
 * Two things make it honest. First, it models Meta's CURRENT mechanics
 * (per-message pricing since 1 July 2025: marketing always billed; utility
 * and authentication billed outside an open customer service window;
 * service messages free) rather than the retired conversation model.
 * Second, it never invents a rate — rates come from `meta-rates.json`,
 * which ships empty, so by default the visitor types the number from their
 * own Meta rate card and the tool does the arithmetic.
 */

interface CountryRate {
  code: string;
  marketing: number;
  utility: number;
  authentication: number;
}

const CATEGORIES = ['marketing', 'utility', 'authentication'] as const;
type Category = (typeof CATEGORIES)[number];

const countries = (rateCard.countries ?? []) as CountryRate[];

export function PricingCalculator() {
  const t = useTranslations('tools.pricingCalculator');
  const locale = useLocale();

  const [country, setCountry] = useState(countries[0]?.code ?? '');
  const [volumes, setVolumes] = useState<Record<Category, string>>({
    marketing: '',
    utility: '',
    authentication: '',
  });
  const [rates, setRates] = useState<Record<Category, string>>({
    marketing: '',
    utility: '',
    authentication: '',
  });

  const selected = countries.find((c) => c.code === country);
  const haveTable = countries.length > 0;

  const money = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency',
    currency: rateCard.currency,
    maximumFractionDigits: 2,
  });

  const rateFor = (cat: Category): number | null => {
    if (selected) return selected[cat];
    const typed = Number.parseFloat(rates[cat]);
    return Number.isFinite(typed) && typed >= 0 ? typed : null;
  };

  const lines = CATEGORIES.map((cat) => {
    const volume = Number.parseInt(volumes[cat], 10);
    const rate = rateFor(cat);
    const count = Number.isFinite(volume) && volume > 0 ? volume : 0;
    return { cat, count, rate, cost: rate === null ? null : count * rate };
  });

  const complete = lines.every((l) => l.cost !== null || l.count === 0);
  const total = lines.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const anyVolume = lines.some((l) => l.count > 0);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-card border border-border bg-surface p-6">
        {haveTable ? (
          <Field id="pc-country" label={t('countryLabel')}>
            <select
              id="pc-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={fieldClass}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <p className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
            {t('noTable')}{' '}
            <a
              href={rateCard.source}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent underline hover:text-accent-hover"
            >
              {t('rateCardLink')}
            </a>
          </p>
        )}

        <div className="mt-5 grid gap-5">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-xl border border-border p-4">
              <p className="font-medium">{t(`category.${cat}.name`)}</p>
              <p className="mt-1 text-xs text-muted">{t(`category.${cat}.when`)}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field id={`pc-vol-${cat}`} label={t('volumeLabel')}>
                  <input
                    id={`pc-vol-${cat}`}
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="0"
                    value={volumes[cat]}
                    onChange={(e) => setVolumes({ ...volumes, [cat]: e.target.value })}
                    className={fieldClass}
                  />
                </Field>
                {selected ? null : (
                  <Field id={`pc-rate-${cat}`} label={t('rateLabel', { currency: rateCard.currency })}>
                    <input
                      id={`pc-rate-${cat}`}
                      inputMode="decimal"
                      dir="ltr"
                      placeholder="0.0000"
                      value={rates[cat]}
                      onChange={(e) => setRates({ ...rates, [cat]: e.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                )}
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-border-strong p-4">
            <p className="font-medium">{t('category.service.name')}</p>
            <p className="mt-1 text-sm text-ok">{t('category.service.when')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-card border border-border bg-surface p-6">
          <h2 className="font-semibold">{t('resultTitle')}</h2>
          {!anyVolume ? (
            <p className="mt-3 text-muted">{t('empty')}</p>
          ) : (
            <>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-muted">
                    <th className="pb-2 text-start font-medium">{t('thCategory')}</th>
                    <th className="pb-2 text-end font-medium">{t('thVolume')}</th>
                    <th className="pb-2 text-end font-medium">{t('thCost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.cat} className="border-t border-border">
                      <td className="py-2">{t(`category.${l.cat}.name`)}</td>
                      <td className="py-2 text-end font-mono">{l.count}</td>
                      <td className="py-2 text-end font-mono">
                        {l.count === 0 ? '—' : l.cost === null ? t('needRate') : money.format(l.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border-strong font-semibold">
                    <td className="pt-3">{t('total')}</td>
                    <td />
                    <td className="pt-3 text-end font-mono">
                      {complete ? money.format(total) : t('incomplete')}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="mt-4 text-sm text-muted">{t('estimateNote')}</p>
            </>
          )}
        </div>

        {/* Mandatory disclaimer + dated rates line (brief §4). */}
        <div className="rounded-card border border-border bg-surface-2 p-6 text-sm">
          <p className="font-medium">{t('disclaimerTitle')}</p>
          <p className="mt-2 text-muted">{t('disclaimer')}</p>
          <p className="mt-3 text-muted">
            {t('modelLine', { date: rateCard.modelEffectiveFrom })}
          </p>
          <p className="mt-1 text-muted">
            {rateCard.ratesLastUpdated
              ? t('ratesUpdated', { date: rateCard.ratesLastUpdated })
              : t('ratesNotLoaded')}
          </p>
          <p className="mt-3">
            <a
              href={rateCard.source}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent underline hover:text-accent-hover"
            >
              {t('rateCardLink')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
