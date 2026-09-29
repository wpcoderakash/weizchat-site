'use client';

import { useEffect } from 'react';
import { usePathname } from '../../i18n/navigation';

/**
 * Drives `[data-reveal]` (design system, globals.css): marks each element
 * `data-in` the first time it scrolls into view, then stops watching it.
 *
 * One observer for the whole site, re-scanned on every navigation, so a
 * section only has to carry the attribute — no client component per section,
 * and the sections stay server-rendered.
 *
 * The hiding itself is CSS gated on `data-motion`, which the boot script sets
 * before first paint. If this never runs, nothing is hidden: the attribute
 * alone does nothing.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!('motion' in root.dataset)) return;
    const pending = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])'));
    if (pending.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      for (const el of pending) el.dataset.in = '';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.in = '';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    for (const el of pending) observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
