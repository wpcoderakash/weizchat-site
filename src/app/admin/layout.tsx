import type { Metadata } from 'next';
import { Assistant, IBM_Plex_Mono } from 'next/font/google';
import '../globals.css';
import './admin.css';
import pkg from '../../../package.json';
import { currentUser } from '../../cms/auth';
import { AdminSide } from '../../components/admin/admin-side';

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
const assistant = Assistant({ subsets: ['hebrew', 'latin'], variable: '--f-assistant' });
const plexMono = IBM_Plex_Mono({ weight: ['400', '600'], subsets: ['latin'], variable: '--f-mono' });

export const metadata: Metadata = {
  title: 'WeizChat CMS',
  // The editor is not a page for the public or for search engines.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Signed in → the full shell (sidebar + topbar). Signed out (the login
  // page, or an unconfigured install) → just the frame, no chrome to leak.
  const user = await currentUser();
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${assistant.variable} ${plexMono.variable}`}
      style={
        {
          '--font-body': 'var(--f-assistant)',
          '--font-display': 'var(--f-assistant)',
          '--font-mono': 'var(--f-mono)',
        } as React.CSSProperties
      }
    >
      <body>
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
                  <span className="cms-chip">
                    {user.username} · {user.role.replace('_', ' ')}
                  </span>
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
