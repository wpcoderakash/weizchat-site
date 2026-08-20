import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { site } from '../../config/site';
import inboxShot from '../../../public/product/inbox-chat.png';

/**
 * Hero (§5.2): outcome promise, plain-words subhead, trial + demo CTAs.
 * The visual is a REAL screenshot of the running product (fixture data,
 * phone numbers masked) — the brief bans fake dashboards.
 */
export function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="text-4xl sm:text-5xl">{t('title')}</h1>
          <p className="mt-5 max-w-lg text-lg text-muted">{t('sub')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`${site.appUrl}/login`}
              className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-fg hover:bg-accent-hover"
            >
              {t('ctaTrial')}
            </a>
            <Link
              href="/contact"
              className="rounded-full border border-border-strong px-6 py-3 font-semibold text-fg hover:border-accent hover:text-accent"
            >
              {t('ctaDemo')}
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-card border border-border shadow-lg">
          <Image src={inboxShot} alt={t('imageAlt')} priority sizes="(min-width: 1024px) 560px, 100vw" />
        </div>
      </div>
    </section>
  );
}
