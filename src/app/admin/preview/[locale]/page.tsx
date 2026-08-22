import { notFound, redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { isSignedIn } from '../../../../cms/auth';
import { getLandingDraft } from '../../../../cms/store';
import { directionFor } from '../../../../i18n/routing';
import { LandingSections } from '../../../[locale]/page';

export const dynamic = 'force-dynamic';

const LOCALES = new Set(['he', 'en']);

/**
 * Preview.
 *
 * Renders the DRAFT through the very same section components the public
 * page uses — not a second rendering path that could drift from it. What
 * you see here is what publishing will produce.
 *
 * It sits behind the admin session, so an unpublished draft is never
 * readable by a visitor who guesses the URL.
 */
export default async function Preview({ params }: { params: Promise<{ locale: string }> }) {
  if (!(await isSignedIn())) redirect('/admin/login');
  const { locale } = await params;
  if (!LOCALES.has(locale)) notFound();

  setRequestLocale(locale);
  const page = getLandingDraft(locale);
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="cms-preview-bar">
        Draft preview · {locale.toUpperCase()} · {page.published ? 'published' : 'not published'}
      </div>
      {/* The public direction, inside the admin's LTR chrome. */}
      <div dir={directionFor(locale)} className="cms-preview-frame">
        <main>
          <LandingSections page={page} locale={locale} />
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
