import { redirect } from 'next/navigation';
import { adminConfigured, isSignedIn } from '../../cms/auth';

export const dynamic = 'force-dynamic';

/** /admin is a doorway: to the login, or straight to the editor. */
export default async function AdminIndex() {
  if (!adminConfigured()) {
    return (
      <div className="cms-login">
        <div className="cms-card" style={{ padding: '1.25rem', maxWidth: '30rem' }}>
          <h1 style={{ marginTop: 0, fontSize: '1.1rem' }}>The CMS is not configured</h1>
          <p className="cms-note">
            Set <code>CMS_ADMIN_USERNAME</code> and <code>CMS_ADMIN_PASSWORD</code> (at least 8
            characters) in the environment and restart. Until then the admin refuses to run — an
            editor with no credentials is worse than no editor.
          </p>
        </div>
      </div>
    );
  }
  redirect((await isSignedIn()) ? '/admin/landing/en' : '/admin/login');
}
