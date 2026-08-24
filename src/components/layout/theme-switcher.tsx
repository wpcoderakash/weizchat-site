'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';

type Theme = 'light' | 'dark';

const KEY = 'theme';
const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light';
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function writeTheme(next: Theme): void {
  document.documentElement.dataset['theme'] = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Blocked storage: the switch still works for this page.
  }
  listeners.forEach((cb) => cb());
}

/**
 * The light / dark switch. Flips the document theme, persists the choice in
 * localStorage; the locale layout's boot script applies it before first
 * paint on the next load. Until someone chooses, the OS setting decides.
 */
export function ThemeSwitcher() {
  const t = useTranslations('nav');
  // The document attribute is the source of truth (the boot script set it
  // before paint); the server snapshot is 'light' so hydration stays clean.
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'light' as Theme);

  function toggle() {
    writeTheme(theme === 'dark' ? 'light' : 'dark');
  }

  const label = t('themeSwitch');
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={label}
      title={label}
      className="theme-toggle"
      onClick={toggle}
    >
      <Sun className="track-icon sun" />
      <Moon className="track-icon moon" />
      <span className="knob" aria-hidden>
        {dark ? <Moon /> : <Sun />}
      </span>
    </button>
  );
}

function Sun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function Moon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
