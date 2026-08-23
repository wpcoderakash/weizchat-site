import { notFound, redirect } from 'next/navigation';
import { isSignedIn } from '../../../../../cms/auth';
import { docStatus, draftDoc } from '../../../../../cms/docs';
import { pageBySlug, publicUrl } from '../../../../../cms/registry';
import { DocEditor } from '../../../../../components/admin/doc-editor';

export const dynamic = 'force-dynamic';

const LOCALES = new Set(['en', 'he']);

/** One page's editor, generic or bespoke depending on its kind. */
export default async function PageEditorRoute({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  if (!(await isSignedIn())) redirect('/admin/login');
  const { slug, locale } = await params;
  const def = pageBySlug(slug);
  if (!def || !LOCALES.has(locale)) notFound();

  return (
    <DocEditor
      kind={def.kind}
      apiKind="page"
      slug={def.slug}
      locale={locale}
      title={def.title}
      publicPath={publicUrl(def, locale)}
      initial={draftDoc(def.schema, 'page', def.slug, locale, def.builtIn(locale))}
      initialStatus={docStatus(def.schema, 'page', def.slug, locale)}
    />
  );
}
