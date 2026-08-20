import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { WeizMark } from '../../components/weiz-mark';

/**
 * Scaffold proof page (step 2 only): tokens, fonts and direction render in
 * all three locales. Replaced by the real home page in step 4.
 */
export default function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('scaffold');

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="flex items-center gap-3 font-semibold">
        <WeizMark size={30} /> WeizChat
      </p>
      <h1 className="mt-8 text-5xl">{t('title')}</h1>
      <p className="mt-4 text-muted">{t('body')}</p>
      <p className="mt-6 font-mono text-sm text-accent">{t('proof')}</p>
      <button
        type="button"
        className="mt-8 rounded-full bg-accent px-6 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover"
      >
        {t('cta')}
      </button>
    </main>
  );
}
