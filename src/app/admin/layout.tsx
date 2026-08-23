import type { Metadata } from 'next';
import { Assistant, IBM_Plex_Mono } from 'next/font/google';
import '../globals.css';
import './admin.css';

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        <div className="cms">{children}</div>
      </body>
    </html>
  );
}
