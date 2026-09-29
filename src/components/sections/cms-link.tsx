import type { CmsLink } from '../../cms/schema';
import { Link } from '../../i18n/navigation';

/**
 * Renders a CMS link field.
 *
 * `enabled: false` renders nothing — an editor turning a button off must
 * remove it, not grey it out. An absolute href leaves the site, so it goes
 * through a plain anchor with the right rel; a relative one stays inside
 * the locale-aware router.
 */
export function CmsCta({
  link,
  className,
  children,
}: {
  link: CmsLink;
  className: string;
  /** Decoration after the label (the design system's arrow). */
  children?: React.ReactNode;
}) {
  if (!link.enabled) return null;

  const external = /^https?:\/\//i.test(link.href);
  if (external || link.newTab) {
    return (
      <a
        href={link.href}
        className={className}
        {...(link.newTab ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      >
        {link.label}
        {children}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
      {children}
    </Link>
  );
}
