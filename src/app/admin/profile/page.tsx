import { redirect } from 'next/navigation';
import { currentUser } from '../../../cms/auth';
import { ProfileForm } from '../../../components/admin/profile-form';

export const dynamic = 'force-dynamic';

/** Your own account: who you are signed in as, and your password. */
export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  return <ProfileForm username={user.username} role={user.role} />;
}
