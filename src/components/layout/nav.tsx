'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '../../i18n/navigation';
import type { GlobalDoc } from '../../cms/site-schema';
import { resourceRoutes, solutionRoutes, toolRoutes } from '../../config/routes';
import { WeizMark } from '../weiz-mark';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeSwitcher } from './theme-switcher';

/**
 * Top navigation (brief §5.1): logo · Solutions ▾ · Tools ▾ · Resources ·
 * Pricing · language switcher · Login (ghost) · Start free trial (primary).
 * Dropdowns are real disclosure buttons — keyboard first, Escape closes,
 * outside click closes; position uses logical properties so RTL mirrors.
 */

type MenuId = 'solutions' | 'tools' | null;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={10}
      height={10}
      aria-hidden="true"
      className={`transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function Nav({ g }: { g: GlobalDoc }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  // Any navigation closes everything (state adjusted during render, per the
  // React "adjusting state when a prop changes" pattern — no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpenMenu(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const solutionLabel = (key: string) => g.solutionLabels[key as keyof typeof g.solutionLabels];
  const toolLabel = (key: string) => g.toolLabels[key as keyof typeof g.toolLabels];
  const resourceLabel = (key: string) => g.resourceLabels[key as keyof typeof g.resourceLabels];

  const dropdown = (
    id: Exclude<MenuId, null>,
    label: string,
    items: readonly { href: string; key: string; comingSoon?: boolean }[],
    labelOf: (key: string) => string,
  ) => (
    <div className="relative">
      <button
        type="button"
        aria-expanded={openMenu === id}
        aria-haspopup="menu"
        onClick={() => setOpenMenu(openMenu === id ? null : id)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-fg hover:bg-accent-soft/60"
      >
        {label}
        <Chevron open={openMenu === id} />
      </button>
      {openMenu === id ? (
        <div
          role="menu"
          className="absolute start-0 top-full z-40 mt-2 w-64 rounded-card border border-border bg-surface p-2 shadow-lg"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              role="menuitem"
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-fg hover:bg-accent-soft/60"
            >
              {labelOf(item.key)}
              {'comingSoon' in item && item.comingSoon ? (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                  {g.nav.comingSoon}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-fg">
          <WeizMark size={26} />
          <span className="text-lg">WeizChat</span>
        </Link>

        {/* Desktop */}
        <nav aria-label={t('primary')} className="ms-6 hidden items-center gap-1 lg:flex">
          {dropdown('solutions', g.nav.solutions, solutionRoutes, solutionLabel)}
          {dropdown('tools', g.nav.tools, toolRoutes, toolLabel)}
          {resourceRoutes.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-fg hover:bg-accent-soft/60"
            >
              {resourceLabel(r.key)}
            </Link>
          ))}
          <Link
            href="/pricing"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-fg hover:bg-accent-soft/60"
          >
            {g.nav.pricing}
          </Link>
        </nav>

        <div className="ms-auto hidden items-center gap-3 lg:flex">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <a
            href={`${g.site.appUrl}/login`}
            className="rounded-full border border-border-strong px-4 py-1.5 text-sm font-semibold text-fg hover:border-accent hover:text-accent"
          >
            {g.nav.login}
          </a>
          <a
            href={`${g.site.appUrl}/login`}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
          >
            {g.nav.startTrial}
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label={t('menu')}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="ms-auto rounded-lg border border-border p-2 lg:hidden"
        >
          <svg viewBox="0 0 20 20" width={18} height={18} aria-hidden="true">
            {mobileOpen ? (
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" />
            ) : (
              <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.8" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen ? (
        <nav
          aria-label={t('primary')}
          className="border-t border-border bg-surface px-6 py-4 lg:hidden"
        >
          <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {g.nav.solutions}
          </p>
          {solutionRoutes.map((r) => (
            <Link key={r.href} href={r.href} className="flex items-center gap-2 py-1.5 text-fg">
              {solutionLabel(r.key)}
              {'comingSoon' in r && r.comingSoon ? (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                  {g.nav.comingSoon}
                </span>
              ) : null}
            </Link>
          ))}
          <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {g.nav.tools}
          </p>
          {toolRoutes.map((r) => (
            <Link key={r.href} href={r.href} className="block py-1.5 text-fg">
              {toolLabel(r.key)}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-3">
            {resourceRoutes.map((r) => (
              <Link key={r.href} href={r.href} className="text-fg">
                {resourceLabel(r.key)}
              </Link>
            ))}
            <Link href="/pricing" className="text-fg">
              {g.nav.pricing}
            </Link>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <a
              href={`${g.site.appUrl}/login`}
              className="rounded-full border border-border-strong px-4 py-1.5 text-sm font-semibold"
            >
              {g.nav.login}
            </a>
            <a
              href={`${g.site.appUrl}/login`}
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg"
            >
              {g.nav.startTrial}
            </a>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <ThemeSwitcher />
            <LocaleSwitcher />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
