import { redirect } from 'next/navigation';
import { adminConfigured, currentUser } from '../../cms/auth';

export const dynamic = 'force-dynamic';

/** The dashboard: every manageable area, filtered by role. */
export default async function AdminHome() {
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
  const user = await currentUser();
  if (!user) redirect('/admin/login');

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const isSuper = user.role === 'super_admin';

  return (
    <>
      <div className="cms-bar">
        <h1>WeizChat CMS</h1>
        <span className="cms-sec-id">
          {user.username} · {user.role.replace('_', ' ')}
        </span>
        <div className="cms-spacer" />
        <a className="cms-btn" href="/api/admin/preview/stop?redirect=/admin">
          Exit preview
        </a>
        <form action="/api/admin/session" method="post" style={{ display: 'contents' }}>
          <a className="cms-btn" href="/admin/logout">
            Sign out
          </a>
        </form>
      </div>
      <div className="cms-wrap">
        <div className="cms-tiles">
          <a href="/admin/pages">
            <h2>Pages</h2>
            <p>Every page on the site: sections, text, images, SEO, publish state.</p>
          </a>
          <a href="/admin/posts">
            <h2>Posts</h2>
            <p>The blog and the information center — write, edit, publish.</p>
          </a>
          <a href="/admin/media">
            <h2>Media</h2>
            <p>Upload and manage the images pages use.</p>
          </a>
          {isAdmin ? (
            <a href="/admin/global/en">
              <h2>Global content</h2>
              <p>Navigation, footer, company identity and shared buttons.</p>
            </a>
          ) : null}
          {isSuper ? (
            <a href="/admin/users">
              <h2>Users</h2>
              <p>Who can sign in here, and what they may touch.</p>
            </a>
          ) : null}
        </div>
        <p className="cms-note">
          Locked on purpose: the Meta partner badge, the footer trademark attribution, and pricing
          tier names, prices and quotas. Those are compliance and product truths, not content
          (ADR-0032).
        </p>
      </div>
    </>
  );
}
