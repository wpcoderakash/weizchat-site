import fs from 'node:fs';
import { redirect } from 'next/navigation';
import { adminConfigured, currentUser, listUsers } from '../../cms/auth';
import { recentActivity, type ActivityRow } from '../../cms/docs';
import { countNewLeads } from '../../cms/leads';
import { adminListPosts } from '../../cms/posts';
import { PAGES, pageBySlug } from '../../cms/registry';
import { MEDIA_DIR } from '../../lib/paths';

export const dynamic = 'force-dynamic';

/**
 * The dashboard. Every number on it is counted from the store at request
 * time, and the activity feed is read from the envelopes' own updatedAt /
 * updatedBy stamps — documents never touched are simply not in it. No
 * synthetic history, ever.
 */

function mediaCount(): number {
  try {
    return fs
      .readdirSync(MEDIA_DIR)
      .filter((f) => !f.startsWith('.')).length;
  } catch {
    return 0;
  }
}

function subject(row: ActivityRow): { label: string; href: string } {
  if (row.kind === 'global') {
    return { label: 'Header & Footer', href: `/admin/global/${row.locale}` };
  }
  if (row.kind === 'post') {
    const [collection, ...rest] = row.slug.split('--');
    const slug = rest.join('--');
    return {
      label: `${slug} (${collection === 'blog' ? 'Blog' : 'Info center'})`,
      href: `/admin/posts/${collection}/${slug}/${row.locale}`,
    };
  }
  const def = pageBySlug(row.slug);
  return { label: def?.title ?? row.slug, href: `/admin/pages/${row.slug}/${row.locale}` };
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

const ACTION: Record<ActivityRow['action'], string> = {
  saved: 'saved a draft of',
  published: 'published',
  unpublished: 'unpublished',
};

const statIcon = {
  pages: 'M7 3h8l4 4v14H7zM15 3v4h4',
  posts: 'M5 4h14v16H5zM9 8h6M9 12h6M9 16h4',
  media: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4',
  leads: 'M4 4h16v12H4zM4 13h5l1.5 3h3L15 13h5M8 8h8',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3 2.7-5 6-5s6 2 6 5M16 4.5a3.5 3.5 0 0 1 0 6.6M17 15.2c2.4.5 4 2.1 4 4.8',
};

function Stat({ k, n, icon }: { k: string; n: number; icon: keyof typeof statIcon }) {
  return (
    <div className="cms-stat">
      <div className="k">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={statIcon[icon]} />
        </svg>
        {k}
      </div>
      <div className="n">{n}</div>
    </div>
  );
}

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

  const posts = adminListPosts();
  const activity = recentActivity(8);

  return (
    <>
      <div className="cms-bar">
        <h1>Dashboard</h1>
      </div>
      <div className="cms-wrap">
        <div className="cms-welcome">
          <h1>Welcome back, {user.username.split('@')[0]}</h1>
          <p>Here is what is happening across the site.</p>
        </div>

        <div className="cms-stats">
          <Stat k="Pages" n={PAGES.length} icon="pages" />
          <Stat k="Posts" n={posts.length} icon="posts" />
          <Stat k="Media files" n={mediaCount()} icon="media" />
          <Stat k="New leads" n={countNewLeads()} icon="leads" />
          {isSuper ? <Stat k="Users" n={listUsers().length} icon="users" /> : null}
        </div>

        <h2 className="cms-h2">Recent activity</h2>
        <div className="cms-card">
          {activity.length === 0 ? (
            <p className="cms-empty">
              Nothing yet — this feed fills up as content is saved and published.
            </p>
          ) : (
            <ul className="cms-activity">
              {activity.map((row, i) => {
                const s = subject(row);
                return (
                  <li key={i}>
                    <span className="who">{row.updatedBy ?? 'unknown'}</span>
                    <span>
                      {ACTION[row.action]} <a href={s.href}>{s.label}</a> ·{' '}
                      {row.locale.toUpperCase()}
                    </span>
                    <time dateTime={row.updatedAt}>{ago(row.updatedAt)}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <h2 className="cms-h2">Quick actions</h2>
        <div className="cms-tiles">
          <a href="/admin/pages">
            <h2>Pages</h2>
            <p>Every page on the site: sections, text, images, SEO, publish state.</p>
          </a>
          <a href="/admin/posts/new">
            <h2>Write a post</h2>
            <p>Add a new article to the blog or the information center.</p>
          </a>
          <a href="/admin/media">
            <h2>Media</h2>
            <p>Upload and manage the images pages use.</p>
          </a>
          {isAdmin ? (
            <a href="/admin/global/en">
              <h2>Header &amp; Footer</h2>
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
