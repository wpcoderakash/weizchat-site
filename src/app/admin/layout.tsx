import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { IBM_Plex_Mono, Rubik } from 'next/font/google';
import '../globals.css';
import './admin.css';
import pkg from '../../../package.json';
import { currentUser } from '../../cms/auth';
import { AdminSide } from '../../components/admin/admin-side';
import { ThemeToggle } from '../../components/layout/theme-toggle';

/**
 * The admin's ROOT layout.
 *
 * `/admin` is a sibling of `/[locale]`, not a child of it, and this app has
 * no `app/layout.tsx` — the locale layout is the public branch's root. So
 * this branch must emit its own `<html>` and `<body>`, or Next raises
 * "Missing <html> and <body> tags in the root layout" at runtime. It did.
 *
 * It also imports the public stylesheet, because the preview route renders
 * the real landing-page components inside this branch; without those
 * tokens and utilities the preview would show unstyled markup and lie
 * about what publishing produces.
 */
const rubik = Rubik({ subsets: ['hebrew', 'latin'], variable: '--f-rubik' });
const plexMono = IBM_Plex_Mono({ weight: ['400', '600'], subsets: ['latin'], variable: '--f-mono' });

export const metadata: Metadata = {
  title: 'WeizChat CMS',
  // The editor is not a page for the public or for search engines.
  robots: { index: false, follow: false },
};

// Before first paint: a stored theme choice wins, else the OS setting. The
// key is shared with the public site — one origin, one preference.
const THEME_BOOT = `(function(){try{var s=localStorage.getItem('theme');var t=s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Signed in → the full shell (sidebar + topbar). Signed out (the login
  // page, or an unconfigured install) → just the frame, no chrome to leak.
  const user = await currentUser();
  /*
   * Every /admin route is dynamic, so `src/proxy.ts` gives this half of the
   * site a nonce-only script policy. Next stamps its OWN script tags from
   * the request header; a tag written by hand — the one below — is ours to
   * stamp, and without it the browser silently drops the theme boot and the
   * CMS renders in the wrong theme until the first paint after hydration.
   */
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${rubik.variable} ${plexMono.variable}`}
      style={
        {
          '--font-body': 'var(--f-rubik)',
          '--font-display': 'var(--f-rubik)',
          '--font-mono': 'var(--f-mono)',
        } as React.CSSProperties
      }
    >
      <body>
        {/* suppressHydrationWarning: browsers hide a CSP nonce from the DOM
            after parsing, so React would otherwise report "" vs the nonce. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_BOOT }}
        />
        {/*
          The tool is always LTR even while editing Hebrew: an editor wants
          the chrome to sit still. The preview sets its own direction on the
          rendered page inside.
        */}
        <div className="cms">
          {user ? (
            <>
              <AdminSide role={user.role} version={pkg.version} />
              <div className="cms-main">
                <div className="cms-top">
                  <span className="crumb">
                    Weiz Admin / <strong>Content Manager</strong>
                  </span>
                  <div className="cms-spacer" />
                  <a className="cms-btn" href="/api/admin/preview/stop?redirect=/admin">
                    Exit preview
                  </a>
                  <ThemeToggle label="Dark theme" />
                  <a className="cms-chip cms-chip-link" href="/admin/profile">
                    {user.username} · {user.role.replace('_', ' ')}
                  </a>
                </div>
                {children}
              </div>
            </>
          ) : (
            children
          )}
        </div>
      </body>
    </html>
  );
}
