import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip Next internals and static files; everything else is localized.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
