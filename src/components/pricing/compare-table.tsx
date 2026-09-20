import { getTranslations } from 'next-intl/server';
import { METERED_LIMITS, featureGroups, plans } from '../../content/pricing';
import { Tip } from './tip';

/**
 * The comparison table.
 *
 * Every feature is in every plan, so a grid of identical ticks would compare
 * nothing. What differs — team size, the monthly allowances, support — comes
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
function Check({ label }: { label: string }) {
  return (
    <>
      <svg viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" className="mx-auto text-ok">
        <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </>
  );
}

export async function CompareTable({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const nf = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US');

  const cols = (
    <colgroup>
      <col className="w-[36%]" />
      {plans.map((p) => (
        <col key={p.id} className="w-[16%]" />
      ))}
    </colgroup>
  );
  const head = (hidden: boolean) => (
    <thead className={hidden ? 'sr-only' : undefined}>
      <tr>
        <th scope="col" className="px-4 py-3 text-start text-sm font-medium text-muted">
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
  const rowHead = 'px-4 py-3 text-start text-sm font-medium';
  const cell = 'px-2 py-3 text-center text-sm tabular-nums';

  return (
    <div
      role="region"
      data-compare
      aria-label={t('compare.title')}
      tabIndex={0}
      className="rounded-card border border-border max-md:overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="min-w-[44rem]">
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
                <td key={p.id} className={cell}>
                  {p.pricing === null
                    ? t('card.unlimited')
                    : `${nf.format(p.pricing.included_agents)}–${nf.format(p.pricing.max_agents)}`}
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
                  <td key={p.id} className={cell}>
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
                    {plans.map((p) => (
                      <td key={p.id} className={cell}>
                        <Check label={t('compare.included')} />
                      </td>
                    ))}
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
