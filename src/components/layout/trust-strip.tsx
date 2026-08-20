import { useTranslations } from 'next-intl';
import { site } from '../../config/site';

/**
 * Honest trust strip (brief rule 0.2). While `site.metaPartnerStatus` is
 * 'none' this renders ONLY factual product statements — no badge, no badge
 * slot, no partner wording. The moment the owner flips the flag after a real
 * Meta approval, the earned status renders as translated text; the badge
 * IMAGE stays out until Meta's own asset and usage terms are in hand.
 */
export function TrustStrip() {
  const t = useTranslations('trust');

  const facts = [t('cloudApi'), t('ownWaba'), t('trilingual'), t('humanControl')];

  return (
    <section aria-label={t('label')} className="border-y border-border bg-surface">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4 text-sm text-muted">
        {facts.map((fact) => (
          <li key={fact} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            {fact}
          </li>
        ))}
        {site.metaPartnerStatus !== 'none' ? (
          <li className="flex items-center gap-2 font-semibold text-fg">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
            {t(site.metaPartnerStatus === 'tech-provider' ? 'techProvider' : 'businessPartner')}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
