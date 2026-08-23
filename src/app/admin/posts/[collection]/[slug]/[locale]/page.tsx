import { notFound, redirect } from 'next/navigation';
import { isSignedIn } from '../../../../../../cms/auth';
import { postsAdmin, type Collection } from '../../../../../../cms/posts';
import { PostEditor } from '../../../../../../components/admin/post-editor';

export const dynamic = 'force-dynamic';

export default async function EditPost({
  params,
}: {
  params: Promise<{ collection: string; slug: string; locale: string }>;
}) {
  if (!(await isSignedIn())) redirect('/admin/login');
  const { collection, slug, locale } = await params;
  if (
    (collection !== 'blog' && collection !== 'information-center') ||
    (locale !== 'en' && locale !== 'he')
  ) {
    notFound();
  }
  const doc = postsAdmin.read(collection as Collection, slug, locale);
  if (!doc) notFound();

  return (
    <PostEditor
      isNew={false}
      collection={collection as Collection}
      slug={slug}
      locale={locale}
      initial={doc}
      initialStatus={postsAdmin.status(collection as Collection, slug, locale)}
    />
  );
}
