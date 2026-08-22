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
    <section aria-label={data.label} className="border-y border-border bg-surface">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4 text-sm text-muted">
        {data.facts.map((fact) => (
          <li key={fact.id} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            {fact.text}
          </li>
        ))}
        {site.metaPartnerStatus !== 'none' ? (
          <li className="flex items-center gap-2 font-semibold text-fg">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
            {site.metaPartnerStatus === 'tech-provider' ? data.techProvider : data.businessPartner}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
