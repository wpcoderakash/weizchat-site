import type { CmsSection } from '../../cms/schema';
import { site } from '../../config/site';

type Trust = Extract<CmsSection, { id: 'trust' }>;

/**
 * Honest trust strip (brief rule 0.2). While `site.metaPartnerStatus` is
 * 'none' this renders ONLY the factual statements the editor wrote — no
 * badge, no badge slot. The partner line stays behind the flag in CODE,
 * not behind a CMS toggle: an editor must not be able to publish a Meta
 * status the business has not earned.
 */
export function TrustStrip({ data }: { data: Trust }) {
  return (
    <section aria-label={data.label} className="border-y border-border bg-surface/70">
      <ul className="wrap grid gap-3 py-6 text-sm text-muted sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-10 sm:py-5">
        {data.facts.map((fact, index) => (
          <li
            key={fact.id}
            data-reveal
            style={{ '--i': index } as React.CSSProperties}
            className="flex items-center gap-2.5"
          >
            <Check />
            {fact.text}
          </li>
        ))}
        {site.metaPartnerStatus !== 'none' ? (
          <li className="flex items-center gap-2.5 font-semibold text-fg">
            <Check />
            {site.metaPartnerStatus === 'tech-provider' ? data.techProvider : data.businessPartner}
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function Check() {
  return (
    <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
      <svg viewBox="0 0 12 12" width={10} height={10}>
        <path d="M2.5 6.2l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
