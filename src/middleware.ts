import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  /*
   * Skip Next internals, static files, the API — and `/admin`.
   *
   * The CMS is not a localized page: it has its own always-LTR chrome and
   * lives at one URL. Without this exclusion next-intl reads `admin` as a
   * locale segment and every admin route 404s, which is exactly what
   * happened the first time this ran.
   */
  matcher: '/((?!api|admin|_next|_vercel|.*\\..*).*)',
};
