import { redirect } from 'next/navigation';
import { isSignedIn } from '../../../cms/auth';
import { docStatus } from '../../../cms/docs';
import { PAGES } from '../../../cms/registry';

export const dynamic = 'force-dynamic';

/** The WordPress-style page list: every page × locale with its state. */
export default async function PagesList() {
  if (!(await isSignedIn())) redirect('/admin/login');

  const rows = PAGES.map((def) => ({
    def,
    status: {
      en: docStatus(def.schema, 'page', def.slug, 'en'),
      he: docStatus(def.schema, 'page', def.slug, 'he'),
    },
  }));

  const badge = (s: { hasDraft: boolean; isPublished: boolean; dirty: boolean }) =>
    !s.hasDraft ? (
      <span className="cms-badge-draft">Built-in</span>
    ) : s.isPublished ? (
      <span className="cms-badge-live">{s.dirty ? 'Live · draft edited' : 'Live'}</span>
    ) : (
      <span className="cms-badge-draft">Draft only</span>
    );

  return (
    <>
      <div className="cms-bar">
        <h1>Pages</h1>
        <div className="cms-spacer" />
        <p className="cms-note">“Built-in” means the page shows the content the site shipped with.</p>
      </div>
      <div className="cms-wrap">
        <div className="cms-card" style={{ overflow: 'hidden' }}>
          <table className="cms-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Path</th>
                <th>English</th>
                <th>Hebrew</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ def, status }) => (
                <tr key={def.slug}>
                  <td>
                    <a href={`/admin/pages/${def.slug}/en`}>{def.title}</a>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                    {def.publicPath || '/'}
                  </td>
                  <td>
                    <a href={`/admin/pages/${def.slug}/en`} style={{ fontWeight: 400 }}>
                      {badge(status.en)}
                    </a>
                  </td>
                  <td>
                    <a href={`/admin/pages/${def.slug}/he`} style={{ fontWeight: 400 }}>
                      {badge(status.he)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
