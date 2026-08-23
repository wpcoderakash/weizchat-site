import { notFound, redirect } from 'next/navigation';
import { hasRole } from '../../../../cms/auth';
import { docStatus, draftDoc } from '../../../../cms/docs';
import { globalDocSchema } from '../../../../cms/site-schema';
import { globalDefault } from '../../../../cms/defaults';
import { DocEditor } from '../../../../components/admin/doc-editor';

export const dynamic = 'force-dynamic';

const LOCALES = new Set(['en', 'he']);

/** Global chrome editor: nav, footer, identity, shared CTAs. Admin+. */
export default async function GlobalEditor({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!(await hasRole('admin'))) redirect('/admin');
  const { locale } = await params;
  if (!LOCALES.has(locale)) notFound();

  return (
    <DocEditor
      kind="global"
      apiKind="global"
      slug="site"
      locale={locale}
      title="Global content"
      publicPath={locale === 'he' ? '/heb' : '/'}
      initial={draftDoc(globalDocSchema, 'global', 'site', locale, globalDefault(locale))}
      initialStatus={docStatus(globalDocSchema, 'global', 'site', locale)}
      hasSeo={false}
    />
  );
}
