import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { SESSION_COOKIE, userFromCookieValue } from './cms/auth';
import { maintenanceHtml, readMaintenance } from './cms/maintenance';

/*
 * Node runtime, not edge: the maintenance switch and the session check both
 * read files, which the edge runtime cannot do.
 */
export const config = {
  runtime: 'nodejs',
  /*
   * Skip Next internals, static files, the API — and `/admin`.
   *
   * The CMS is not a localized page: it has its own always-LTR chrome and
   * lives at one URL. Without this exclusion next-intl reads `admin` as a
   * locale segment and every admin route 404s, which is exactly what
   * happened the first time this ran.
   *
   * That exclusion is also what makes maintenance mode safe: the admin is
   * not behind this gate, so turning the site off can never lock the owner
   * out of turning it back on.
   */
  matcher: '/((?!api|admin|_next|_vercel|.*\\..*).*)',
};

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  let state;
  try {
    state = readMaintenance();
  } catch {
    // A switch that cannot be read must not take the site down.
    return intl(request);
  }

  if (state.enabled) {
    // Signed-in editors see the real site, so the content can be checked
    // before maintenance is lifted.
    const signedIn = userFromCookieValue(request.cookies.get(SESSION_COOKIE)?.value) !== null;
    if (!signedIn) {
      const locale = request.nextUrl.pathname.startsWith('/heb') ? 'he' : 'en';
      return new NextResponse(maintenanceHtml(state, locale), {
        // 503, not 200: this is temporary, and a crawler must not record the
        // notice as the page's content.
        status: 503,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'retry-after': String(state.retryAfterMinutes * 60),
          'cache-control': 'no-store',
        },
      });
    }
  }

  return intl(request);
}
