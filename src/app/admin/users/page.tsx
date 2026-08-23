import { redirect } from 'next/navigation';
import { currentUser } from '../../../cms/auth';
import { UserManager } from '../../../components/admin/user-manager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'super_admin') redirect('/admin');
  return <UserManager me={user.username} />;
}
