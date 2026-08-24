'use client';

import { useTranslations } from 'next-intl';
import { ThemeToggle } from './theme-toggle';

/** The public nav's theme toggle: the shared switch with the i18n label. */
export function ThemeSwitcher() {
  const t = useTranslations('nav');
  return <ThemeToggle label={t('themeSwitch')} />;
}
