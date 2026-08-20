import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import {
  Assistant,
  Baloo_Da_2,
  IBM_Plex_Mono,
  Noto_Sans_Bengali,
  Suez_One,
} from 'next/font/google';
import { directionFor, routing } from '../../i18n/routing';
import { site } from '../../config/site';
import { Nav } from '../../components/layout/nav';
import { Footer } from '../../components/layout/footer';
import { CookieConsent } from '../../components/layout/cookie-consent';
import './../globals.css';

/*
 * Typography (design plan): Hebrew-first. Suez One is the display voice —
 * a Hebrew slab that makes `he` the flagship, not the translation.
 * Bengali gets its own declared stack (Baloo Da 2 + Noto Sans Bengali),
 * never a silent fallback.
 */
const suez = Suez_One({ weight: '400', subsets: ['hebrew', 'latin'], variable: '--f-suez' });
const assistant = Assistant({ subsets: ['hebrew', 'latin'], variable: '--f-assistant' });
const plexMono = IBM_Plex_Mono({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--f-mono',
});
const balooDa = Baloo_Da_2({ subsets: ['bengali', 'latin'], variable: '--f-baloo' });
const notoBengali = Noto_Sans_Bengali({ subsets: ['bengali', 'latin'], variable: '--f-noto-bn' });

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

  const fontVars =
    locale === 'bn'
      ? `${balooDa.variable} ${notoBengali.variable} ${plexMono.variable}`
      : `${suez.variable} ${assistant.variable} ${plexMono.variable}`;
  const fontStyle =
    locale === 'bn'
      ? ({
          '--font-display': 'var(--f-baloo)',
          '--font-body': 'var(--f-noto-bn)',
          '--font-mono': 'var(--f-mono)',
        } as React.CSSProperties)
      : ({
          '--font-display': 'var(--f-suez)',
          '--font-body': 'var(--f-assistant)',
          '--font-mono': 'var(--f-mono)',
        } as React.CSSProperties);

  return (
    <html lang={locale} dir={directionFor(locale)} className={fontVars} style={fontStyle}>
      <head>
        {site.metaDomainVerification ? (
          <meta name="facebook-domain-verification" content={site.metaDomainVerification} />
        ) : null}
      </head>
      <body>
        <NextIntlClientProvider>
          <Nav />
          <div className="min-h-dvh">{children}</div>
          <Footer />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
