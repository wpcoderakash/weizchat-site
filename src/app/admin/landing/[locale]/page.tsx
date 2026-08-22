import { notFound, redirect } from 'next/navigation';
import { isSignedIn } from '../../../../cms/auth';
import { getLandingDraft } from '../../../../cms/store';
import { PageEditor } from '../../../../components/admin/page-editor';

export const dynamic = 'force-dynamic';

const LOCALES = new Set(['he', 'en']);

/** The editor for one locale's landing page. */
export default async function LandingEditor({ params }: { params: Promise<{ locale: string }> }) {
  if (!(await isSignedIn())) redirect('/admin/login');
  const { locale } = await params;
  if (!LOCALES.has(locale)) notFound();
  return <PageEditor initial={getLandingDraft(locale)} locale={locale} />;
}
