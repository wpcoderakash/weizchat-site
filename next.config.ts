import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
// Plugin named as a string so the options stay serializable under Turbopack.
const withMDX = createMDX({ options: { remarkPlugins: ['remark-gfm'] } });

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  poweredByHeader: false,
  /*
   * A self-contained server bundle: `.next/standalone` carries its own
   * minimal node_modules, so the host needs Node and nothing else — no
   * install, no build, no toolchain on a small VPS. See DEPLOY.md; the
   * deploy script also ships `messages/` and `src/content/`, which the
   * bundler cannot see because they are read from disk at runtime.
   */
  output: 'standalone',
  // The tracer walks the project directory; without this it copies a previous
  // release into the next one.
  outputFileTracingExcludes: { '*': ['release/**', '.git/**'] },

  /*
   * The two headers that do not vary per request (UI2R-03). The
   * Content-Security-Policy needs a fresh nonce every time, so it is set in
   * `src/middleware.ts` instead.
   *
   * nginx already sends X-Content-Type-Options, X-Frame-Options and
   * Referrer-Policy on this vhost, and they are correct — they are
   * deliberately NOT repeated here. Two values for one header is how
   * app.weiz.chat ended up sending both DENY and SAMEORIGIN, which some
   * browsers resolve by ignoring both.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          /*
           * HSTS. This origin had none, and neither does the apex: visiting
           * `http://www.weiz.chat` answers 301 over plaintext, and that first
           * request is interceptable — on the origin where the sign-in dialog
           * and the CMS login take passwords.
           *
           * Two years, subdomains included. No `preload`: that is effectively
           * irreversible and the owner's call, not ours.
           *
           * Browsers ignore HSTS over plain HTTP, so local development is
           * unaffected.
           *
           * NOTE: this covers www only. `https://weiz.chat` 301s here and is
           * served by nginx, not by Next, so the apex still needs its own
           * HSTS added to the vhost — see deploy notes.
           */
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          /*
           * A marketing site needs none of these. The app keeps camera and
           * microphone for voice notes and photos; nothing here does, so
           * everything is closed.
           */
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), display-capture=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(withMDX(nextConfig));
