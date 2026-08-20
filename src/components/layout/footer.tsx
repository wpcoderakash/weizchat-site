import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { site } from '../../config/site';
import { legalRoutes, resourceRoutes, solutionRoutes, toolRoutes } from '../../config/routes';
import { WeizMark } from '../weiz-mark';
import { LocaleSwitcher } from './locale-switcher';

/**
 * Footer (brief §5.14): legal identity, every legal link, solutions, tools,
 * resources, language switcher — and the rule-0.1 trademark attribution,
 * verbatim, on every page. Legal identity fields are __PLACEHOLDER__ values
 * from site.ts until the owner supplies the real ones (brief SECTION 10).
 */
export function Footer() {
  const t = useTranslations('footer');

  const column = (
    title: string,
    items: readonly { href: string; key: string }[],
    ns: string,
  ) => (
    <nav aria-label={title}>
      <p className="pb-3 text-sm font-semibold text-fg">{title}</p>
      <ul className="flex flex-col gap-2 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-muted hover:text-fg">
              {t(`${ns}.${item.key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="flex items-center gap-2.5 font-semibold text-fg">
            <WeizMark size={24} />
            <span className="text-lg">{site.name}</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">{t('tagline')}</p>
          <address className="mt-5 text-sm not-italic leading-relaxed text-muted">
            {site.legal.companyName}
            <br />
            {t('companyId')}: {site.legal.companyId}
            <br />
            {site.legal.address}
            <br />
            <a href={`mailto:${site.supportEmail}`} className="hover:text-fg">
              {site.supportEmail}
            </a>
            <br />
            {site.legal.phone}
          </address>
          <div className="mt-5">
            <LocaleSwitcher />
          </div>
        </div>

        {column(t('solutionsTitle'), solutionRoutes, 'solution')}
        {column(t('toolsTitle'), toolRoutes, 'tool')}
        <div className="flex flex-col gap-8">
          {column(t('resourcesTitle'), resourceRoutes, 'resource')}
          {column(t('legalTitle'), legalRoutes, 'legal')}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted">
          {/* Rule 0.1 — trademark attribution, do not reword casually. */}
          <p>{t('metaAttribution')}</p>
          <p>
            © {new Date().getFullYear()} {site.legal.companyName} · {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
