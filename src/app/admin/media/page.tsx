import { redirect } from 'next/navigation';
import { isSignedIn } from '../../../cms/auth';
import { MediaLibrary } from '../../../components/admin/media-library';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  if (!(await isSignedIn())) redirect('/admin/login');
  return <MediaLibrary />;
}
