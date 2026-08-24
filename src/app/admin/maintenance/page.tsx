import { redirect } from 'next/navigation';
import { currentUser } from '../../../cms/auth';
import { readMaintenance } from '../../../cms/maintenance';
import { MaintenanceForm } from '../../../components/admin/maintenance-form';

export const dynamic = 'force-dynamic';

/** The switch that takes the public site down, and the notice visitors see. */
export default async function MaintenancePage() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  if (user.role === 'editor') redirect('/admin');
  return <MaintenanceForm initial={readMaintenance()} />;
}
