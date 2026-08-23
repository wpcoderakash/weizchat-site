import { redirect } from 'next/navigation';
import { isSignedIn } from '../../../cms/auth';
import { LoginForm } from '../../../components/admin/login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await isSignedIn()) redirect('/admin');
  return <LoginForm />;
}
