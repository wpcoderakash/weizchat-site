import { getTranslations } from 'next-intl/server';
import { METERED_LIMITS, featureGroups, plans } from '../../content/pricing';
import { Tip } from './tip';

/**
 * The comparison table.
 *
 * Every feature is in every plan, so a grid of identical ticks would compare
 * nothing — a shared feature says "Included in every plan" ONCE, in a single
 * cell spanning the plan columns. What differs — team size, the monthly allowances, support — comes
 * FIRST and open; the feature groups follow, collapsed, as the honest answer
 * to "is X included?" (yes, on every plan).
 *
 * Groups are native <details>: keyboard-operable and announced with no script.
 * Each group is its own table with the same fixed columns, so they line up
 * while collapsing independently. The wrapper scrolls sideways on a phone and
 * is focusable, because a scrollable region a keyboard cannot reach is a trap;
 * from `md` up the table fits and overflow stays visible, so a tooltip in the
 * last row is never clipped.
 */
function Check() {
  return (
    <svg viewBox="0 0 20 20" width={16} height={16} aria-hidden="true" className="shrink-0 text-ok">
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export async function CompareTable({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const nf = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US');

  const cols = (
    <colgroup>
      <col className="w-[40%] md:w-[36%]" />
      {plans.map((p) => (
        <col key={p.id} className="w-[16%]" />
      ))}
    </colgroup>
  );
  const head = (hidden: boolean) => (
    <thead className={hidden ? 'sr-only' : undefined}>
      <tr>
        {/* Pinned on a phone like the row headers under it — otherwise the plan
            names slide over the pinned labels and stop lining up with their
            columns. */}
        <th
          scope="col"
          className="px-4 py-3 text-start text-sm font-medium text-muted max-md:sticky max-md:start-0 max-md:z-10 max-md:bg-bg"
        >
          {t('compare.feature')}
        </th>
        {plans.map((p) => (
          <th key={p.id} scope="col" className="px-2 py-3 text-center text-sm font-semibold">
            {t(`tier.${p.id}.name`)}
          </th>
        ))}
      </tr>
    </thead>
  );
  // On a phone the plans scroll sideways, so the feature name is pinned to the
  // inline-start edge — otherwise you scroll to Business and no longer know
  // which row you are reading. It needs a background (rows slide under it) and
  // it rises above its neighbours while a tooltip inside it is open, because a
  // later pinned cell would otherwise paint over the bubble.
  const rowHead =
    'px-4 py-3 text-start text-sm font-medium max-md:sticky max-md:start-0 max-md:z-10 max-md:bg-bg max-md:hover:z-30 max-md:focus-within:z-30';
  const cell = 'px-2 py-3 text-center text-sm tabular-nums';
  // The rows that differ between plans are the point of the table.
  const differs = `${cell} font-semibold text-fg`;

  return (
    <div
      role="region"
      data-compare
      aria-label={t('compare.title')}
      tabIndex={0}
      className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-sm)] max-md:overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="min-w-[40rem]">
        {/* What actually differs — always open. */}
        <table className="w-full table-fixed border-collapse">
          <caption className="bg-surface px-4 py-3 text-start text-base font-semibold">
            {t('compare.limitsGroup')}
          </caption>
          {cols}
          {head(false)}
          <tbody className="divide-y divide-border border-t border-border">
            <tr>
              <th scope="row" className={rowHead}>
                {t('card.agentsRow')}
              </th>
              {plans.map((p) => (
                <td key={p.id} className={differs}>
                  {p.pricing === null
                    ? t('card.unlimited')
                    : (
                      // A numeric range reads left to right in Hebrew too;
                      // without this the bidi algorithm renders "3–10" as "10–3".
                      <span dir="ltr">
                        {nf.format(p.pricing.included_agents)}–{nf.format(p.pricing.max_agents)}
                      </span>
                    )}
                </td>
              ))}
            </tr>
            {METERED_LIMITS.map((key) => (
              <tr key={key}>
                <th scope="row" className={rowHead}>
                  <span className="me-2">{t(`limits.${key}`)}</span>
                  <Tip
                    label={t('compare.about', { feature: t(`limits.${key}`) })}
                    text={t(`limitTips.${key}`)}
                  />
                </th>
                {plans.map((p) => (
                  <td key={p.id} className={differs}>
                    {p.limits[key] === null ? t('card.unlimited') : nf.format(p.limits[key] as number)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className={rowHead}>
                {t('card.supportRow')}
              </th>
              {plans.map((p) => (
                <td key={p.id} className={`${cell} text-xs sm:text-sm`}>
                  {t(`card.support.${p.support}`)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {Object.entries(featureGroups).map(([group, ids]) => (
          <details key={group} className="group/d border-t border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between bg-surface px-4 py-3 text-base font-semibold hover:text-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
              <span>
                {t(`compare.groups.${group}`)}{' '}
                <span className="text-sm font-normal text-muted">({nf.format(ids.length)})</span>
              </span>
              <svg
                viewBox="0 0 20 20"
                width={16}
                height={16}
                aria-hidden="true"
                className="shrink-0 transition-transform group-open/d:rotate-180 motion-reduce:transition-none"
              >
                <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <table className="w-full table-fixed border-collapse">
              <caption className="sr-only">{t(`compare.groups.${group}`)}</caption>
              {cols}
              {head(true)}
              <tbody className="divide-y divide-border border-t border-border">
                {ids.map((id) => (
                  <tr key={id}>
                    <th scope="row" className={rowHead}>
                      <span className="me-2">{t(`compare.features.${id}.name`)}</span>
                      <Tip
                        label={t('compare.about', { feature: t(`compare.features.${id}.name`) })}
                        text={t(`compare.features.${id}.tip`)}
                      />
                    </th>
                    {/* ONE cell across every plan. Four identical ticks per row,
                        thirty-four rows deep, compares nothing and hides the
                        rows that do differ. */}
                    <td colSpan={plans.length} className={`${cell} text-muted`}>
                      <span className="inline-flex items-center gap-2">
                        <Check />
                        {t('compare.includedAll')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>
    </div>
  );
}
