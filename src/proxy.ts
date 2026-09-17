import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { SESSION_COOKIE, userFromCookieValue } from './cms/auth';
import { maintenanceHtml, readMaintenance } from './cms/maintenance';
import { isLegalPath } from './lib/legal-paths';

/*
 * `proxy.ts`, not `middleware.ts`: Next 16 deprecated the middleware file
 * convention and renamed it, and the build warns on the old name.
 *
 * This file used to declare `runtime: 'nodejs'`, because the maintenance
 * switch and the session check both read files and the edge runtime cannot.
 * Proxy always runs on Node, so the option is not merely unnecessary now —
 * Next refuses the build if it is present.
 */
export const config = {
  /*
   * Skip Next internals, static files and the API.
   *
   * `/admin` USED to be excluded here too, because next-intl reads `admin`
   * as a locale segment and every admin route 404s. It is now matched and
   * branched on below instead — the exclusion also kept the CMS out of the
   * Content-Security-Policy, and `/admin/login` is where the operator types
   * a password (UI2R-03). The branch keeps next-intl away from it, which was
   * the actual requirement.
   *
   * Maintenance mode is still safe: the admin branch returns before the
   * maintenance gate, so turning the site off can never lock the owner out
   * of turning it back on.
   */
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};

const intl = createMiddleware(routing);

/**
 * The Content-Security-Policy for the marketing site (UI2R-03).
 *
 * `app.weiz.chat` has had a strict CSP since P7. This origin had none — and
 * it is the one where people actually type a password: the sign-in and
 * registration dialog collects it here (ADR-0044 moves the SESSION to the app
 * with a bearer token and a handoff code; it does not move the password
 * entry), and the CMS at `/admin/login` takes the operator's.
 *
 * ## Two policies, because this site renders two ways
 *
 * A nonce has to be minted per request and stamped into the HTML, so it only
 * works on a page rendered per request. Next says so plainly: nonces require
 * dynamic rendering. The marketing pages are prerendered — that is the point
 * of them — so a nonce'd policy there would name a nonce that appears on no
 * script tag and block all 42 of them. Measured, not assumed: with one policy
 * for both, `/` served 42 scripts and 0 carried the nonce, which in a browser
 * is a blank page.
 *
 * Every `/admin` route IS dynamic, so the strict policy applies there in full,
 * and that is where the operator's password is typed.
 *
 * The static pages get everything except the nonce. What that costs is real
 * and worth naming: inline script injection would be allowed. What it still
 * buys is the part that matters most here — `connect-src` and `form-action`
 * mean a script that somehow ran has nowhere to send what it read.
 *
 * Making the marketing pages dynamic to close the gap is a decision with a
 * real cost (every page rendered per request, on the site whose job is to
 * load fast) and it is the owner's to make, not one to take by accident.
 *
 * ## strict-dynamic, and why Turnstile is not in script-src
 *
 * On the admin policy, a nonce vouches for our own bundle and
 * `strict-dynamic` lets that bundle load more scripts.
 * `turnstile-widget.tsx` creates its `<script>` with `document.createElement`,
 * so it inherits that trust and needs no host entry. An injected
 * `<script src=…>` is refused even from our own origin.
 *
 * ## style-src keeps 'unsafe-inline', deliberately
 *
 * Next inlines critical CSS and the CMS forms set inline `style` attributes,
 * so a nonce-only style policy would break the first paint. Inline *script*
 * is arbitrary code execution; inline *style* is at worst layout
 * manipulation, and the rest of the policy already bounds where anything
 * could be sent.
 *
 * ## connect-src names app.weiz.chat, and that is the point
 *
 * The auth dialog calls the app's API cross-origin (`credentials: "omit"`,
 * bearer transport). It is the ONLY off-origin destination the browser may
 * reach, so a script that somehow ran here has nowhere to post what it read.
 */
function contentSecurityPolicy(nonce: string | null): string {
  // React uses eval in development for better error stacks; production does
  // not. The release runs a production build, where this is off.
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = nonce
    ? // `strict-dynamic` lets the nonce-trusted bundle load further scripts,
      // which is how Turnstile gets in without a host entry.
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`
    : // No nonce is possible on a prerendered page, and Next's hydration data
      // arrives as ~30 inline scripts. Without 'unsafe-inline' the page does
      // not run at all.
      //
      // Turnstile IS named here, and has to be. Without `strict-dynamic` a
      // host allowlist is what the browser consults, so the widget's
      // `document.createElement('script')` is refused on its origin alone —
      // found by a browser probe, invisible to any amount of header reading:
      // the HTML is identical either way and the bot check simply never
      // appears.
      `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    // `data:` covers inline SVG and the OG images; no remote image host, so a
    // tracking pixel cannot be smuggled into a CMS post.
    "img-src 'self' data: blob:",
    // next/font/google downloads the faces at BUILD time and serves them from
    // our own origin, so there is no fonts.gstatic.com to allow.
    "font-src 'self'",
    "connect-src 'self' https://app.weiz.chat",
    // Turnstile runs its challenge in an iframe (AUTH-001). Its own network
    // calls are governed by its origin's policy, not ours.
    "frame-src https://challenges.cloudflare.com",
    "form-action 'self'",
    // Nothing embeds this site — there is not one iframe in the source. The
    // nginx X-Frame-Options: SAMEORIGIN stays for browsers predating CSP 2;
    // this is the authoritative one, and no second X-Frame-Options is added
    // here, because two conflicting values make some browsers ignore both.
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export default function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith('/admin');
  // Only where it can actually be stamped — see the note above.
  const nonce = isAdmin ? crypto.randomUUID() : null;
  const policy = contentSecurityPolicy(nonce);

  const secured = (response: NextResponse): NextResponse => {
    response.headers.set('Content-Security-Policy', policy);
    return response;
  };

  /*
   * The CMS is not a localized page: it has its own always-LTR chrome and
   * lives at one URL. next-intl must not see it — that was the reason for
   * the old matcher exclusion, and it still holds. It gets the strict policy
   * and nothing else, and it returns BEFORE the maintenance gate so the owner
   * can always reach the switch.
   */
  if (isAdmin && nonce) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    // On the REQUEST as well as the response: this is the copy Next reads to
    // stamp its own scripts. Response-only would produce a policy that blocks
    // the framework's own bootstrap.
    requestHeaders.set('Content-Security-Policy', policy);
    return secured(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  let state;
  try {
    state = readMaintenance();
  } catch {
    // A switch that cannot be read must not take the site down.
    return secured(intl(request));
  }

  if (state.enabled) {
    // Signed-in editors see the real site, so the content can be checked
    // before maintenance is lifted.
    const signedIn = userFromCookieValue(request.cookies.get(SESSION_COOKIE)?.value) !== null;
    // The legal documents stay up regardless. The app's /privacy, /terms and
    // /data-deletion redirect here, and those are the URLs Meta has on file —
    // taking the marketing site down must not turn them into a 503.
    if (!signedIn && !isLegalPath(request.nextUrl.pathname)) {
      const locale = request.nextUrl.pathname.startsWith('/heb') ? 'he' : 'en';
      return secured(
        new NextResponse(maintenanceHtml(state, locale), {
          // 503, not 200: this is temporary, and a crawler must not record the
          // notice as the page's content.
          status: 503,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'retry-after': String(state.retryAfterMinutes * 60),
            'cache-control': 'no-store',
          },
        }),
      );
    }
  }

  return secured(intl(request));
}
