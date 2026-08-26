import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { GlobalDoc } from '../../cms/site-schema';
import { legalRoutes, resourceRoutes, solutionRoutes, toolRoutes } from '../../config/routes';
import { ContactLinks, OfficeList } from '../contact/contact-details';
import { WeizLogo } from '../weiz-logo';
import { LocaleSwitcher } from './locale-switcher';

/**
 * Footer (brief §5.14): legal identity, every legal link, solutions, tools,
 * resources, language switcher — and the rule-0.1 trademark attribution,
 * verbatim, on every page.
 *
 * Phone, WhatsApp and offices come from the CMS contact block and render as
 * links, not text: on a phone, tapping the number calls it or opens the
 * chat. Deriving those hrefs from the machine field is what keeps a pretty
 * label from breaking the link — see lib/contact-links.
 */
export function Footer({ g }: { g: GlobalDoc }) {
  const t = useTranslations('footer');

  const labelSets: Record<string, Record<string, string>> = {
    solution: g.solutionLabels,
    tool: g.toolLabels,
    resource: g.resourceLabels,
    legal: g.footer.legalLabels,
  };
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
              {labelSets[ns]![item.key]!}
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
          <p className="flex items-center">
            <WeizLogo width={112} />
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">{g.footer.tagline}</p>
          <p className="mt-5 text-sm font-medium leading-relaxed text-fg">{g.site.legalName}</p>
          <ContactLinks contact={g.contact} email={g.site.supportEmail} className="mt-3" />
          <OfficeList contact={g.contact} className="mt-6" />
          <div className="mt-5">
            <LocaleSwitcher />
          </div>
        </div>

        {column(g.footer.solutionsTitle, solutionRoutes, 'solution')}
        {column(g.footer.toolsTitle, toolRoutes, 'tool')}
        <div className="flex flex-col gap-8">
          {column(g.footer.resourcesTitle, resourceRoutes, 'resource')}
          {column(g.footer.legalTitle, legalRoutes, 'legal')}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted">
          {/* Rule 0.1 — trademark attribution, do not reword casually. */}
          <p>{t('metaAttribution')}</p>
          <p>
            © {new Date().getFullYear()} {g.site.legalName} · {g.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
