import { redirect } from 'next/navigation';
import { currentUser } from '../../../cms/auth';
import { LeadInbox } from '../../../components/admin/lead-inbox';

export const dynamic = 'force-dynamic';

/** The Form Leads inbox: what the contact form and the waitlists captured. */
export default async function LeadsPage() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  return <LeadInbox />;
}
