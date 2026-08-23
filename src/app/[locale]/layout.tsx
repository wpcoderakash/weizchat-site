import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { IBM_Plex_Mono, Rubik } from 'next/font/google';
import { directionFor, routing } from '../../i18n/routing';
import { site } from '../../config/site';
import { getGlobal } from '../../cms/load';
import { Nav } from '../../components/layout/nav';
import { Footer } from '../../components/layout/footer';
import { CookieConsent } from '../../components/layout/cookie-consent';
import './../globals.css';

/*
 * Typography: Rubik for everything (owner's choice, 2026-08) — one face,
 * full Hebrew support, weight carries the heading hierarchy.
 */
const rubik = Rubik({ subsets: ['hebrew', 'latin'], variable: '--f-rubik' });
const plexMono = IBM_Plex_Mono({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--f-mono',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  metadataBase: new URL(site.url),
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const g = await getGlobal(locale);

  const fontVars = `${rubik.variable} ${plexMono.variable}`;
  const fontStyle = {
    '--font-display': 'var(--f-rubik)',
    '--font-body': 'var(--f-rubik)',
    '--font-mono': 'var(--f-mono)',
  } as React.CSSProperties;

  return (
    <html lang={locale} dir={directionFor(locale)} className={fontVars} style={fontStyle}>
      <head>
        {site.metaDomainVerification ? (
          <meta name="facebook-domain-verification" content={site.metaDomainVerification} />
        ) : null}
      </head>
      <body>
        <NextIntlClientProvider>
          <Nav g={g} />
          <div className="min-h-dvh">{children}</div>
          <Footer g={g} />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
