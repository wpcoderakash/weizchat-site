import { redirect } from 'next/navigation';
import { isSignedIn } from '../../../cms/auth';
import { adminListPosts } from '../../../cms/posts';

export const dynamic = 'force-dynamic';

/** Every post in both collections and locales, drafts included. */
export default async function PostsList() {
  if (!(await isSignedIn())) redirect('/admin/login');
  const posts = adminListPosts();

  return (
    <>
      <div className="cms-bar">
        <a className="cms-btn" href="/admin">
          ←
        </a>
        <h1>Posts</h1>
        <div className="cms-spacer" />
        <a className="cms-btn cms-btn-primary" href="/admin/posts/new">
          New post
        </a>
      </div>
      <div className="cms-wrap">
        <div className="cms-card" style={{ overflow: 'hidden' }}>
          <table className="cms-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Collection</th>
                <th>Locale</th>
                <th>Date</th>
                <th>Tags</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={`${post.collection}/${post.slug}/${post.locale}`}>
                  <td>
                    <a href={`/admin/posts/${post.collection}/${post.slug}/${post.locale}`}>
                      {post.doc.title}
                    </a>
                  </td>
                  <td>{post.collection}</td>
                  <td>{post.locale.toUpperCase()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{post.doc.date}</td>
                  <td>{post.doc.tags.join(', ') || '—'}</td>
                  <td>
                    {post.source === 'mdx' ? (
                      <span className="cms-badge-live">Live · built-in</span>
                    ) : post.status.isPublished ? (
                      <span className="cms-badge-live">{post.status.dirty ? 'Live · draft edited' : 'Live'}</span>
                    ) : (
                      <span className="cms-badge-draft">Draft</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="cms-note">
          “Built-in” posts shipped with the site as files. Opening one and saving creates a CMS
          version that overrides it; Reset on that editor returns to the file.
        </p>
      </div>
    </>
  );
}
