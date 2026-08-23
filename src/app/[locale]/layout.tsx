import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Assistant, IBM_Plex_Mono, Suez_One } from 'next/font/google';
import { directionFor, routing } from '../../i18n/routing';
import { site } from '../../config/site';
import { getGlobal } from '../../cms/load';
import { Nav } from '../../components/layout/nav';
import { Footer } from '../../components/layout/footer';
import { CookieConsent } from '../../components/layout/cookie-consent';
import './../globals.css';

/*
 * Typography (design plan): Hebrew-first. Suez One is the display voice —
 * a Hebrew slab that makes `he` the flagship, not the translation.
 */
const suez = Suez_One({ weight: '400', subsets: ['hebrew', 'latin'], variable: '--f-suez' });
const assistant = Assistant({ subsets: ['hebrew', 'latin'], variable: '--f-assistant' });
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

  const fontVars = `${suez.variable} ${assistant.variable} ${plexMono.variable}`;
  const fontStyle = {
    '--font-display': 'var(--f-suez)',
    '--font-body': 'var(--f-assistant)',
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
