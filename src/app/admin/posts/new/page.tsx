import { redirect } from 'next/navigation';
import { isSignedIn } from '../../../../cms/auth';
import { PostEditor } from '../../../../components/admin/post-editor';

export const dynamic = 'force-dynamic';

/** A blank post. It gets its slug on first save. */
export default async function NewPost() {
  if (!(await isSignedIn())) redirect('/admin/login');
  return (
    <PostEditor
      isNew
      collection="blog"
      slug=""
      locale="en"
      initial={{
        title: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        tags: [],
        image: null,
        body: '',
      }}
      initialStatus={{ hasDraft: false, isPublished: false, dirty: false, updatedAt: null }}
    />
  );
}
