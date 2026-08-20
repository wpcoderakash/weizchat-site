import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Locale-aware Link/router — the only way components may navigate. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
