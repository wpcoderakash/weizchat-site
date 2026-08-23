'use client';

import { usePathname } from 'next/navigation';
import type { Role } from '../../cms/auth';

/**
 * The admin sidebar — matched to the owner's Weiz Admin layout: brand at
 * the top, grouped navigation, View site / Sign out pinned to the bottom.
 * Entries are filtered by role, and every entry is a feature that exists;
 * nothing here links to a page that is not built.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z',
  pages: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
  posts: 'M5 4h14v16H5zM9 8h6M9 12h6M9 16h4',
  add: 'M12 5v14M5 12h14',
  media: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M9 9h.01',
  global: 'M3 5h18v4H3zM3 15h18v4H3zM7 7h.01M7 17h.01',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3 2.7-5 6-5s6 2 6 5M16 4.5a3.5 3.5 0 0 1 0 6.6M17 15.2c2.4.5 4 2.1 4 4.8',
  site: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3z',
  out: 'M14 4h-8v16h8M10 12h11M18 8.5 21.5 12 18 15.5',
};

interface Item {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  newTab?: boolean;
}

export function AdminSide({ role, version }: { role: Role; version: string }) {
  const path = usePathname();
  const isAdmin = role === 'admin' || role === 'super_admin';

  const groups: { label: string | null; items: Item[] }[] = [
    { label: null, items: [{ href: '/admin', label: 'Dashboard', icon: 'dashboard' }] },
    {
      label: 'Content',
      items: [
        { href: '/admin/pages', label: 'Pages', icon: 'pages' },
        { href: '/admin/posts', label: 'All Posts', icon: 'posts' },
        { href: '/admin/posts/new', label: 'Add New', icon: 'add' },
        { href: '/admin/media', label: 'Media Library', icon: 'media' },
      ],
    },
  ];
  if (isAdmin) {
    groups.push({
      label: 'Site',
      items: [{ href: '/admin/global/en', label: 'Header & Footer', icon: 'global' }],
    });
  }
  if (role === 'super_admin') {
    groups.push({ label: 'Access', items: [{ href: '/admin/users', label: 'Users', icon: 'users' }] });
  }

  // The current entry is the LONGEST href that prefixes the path, so
  // /admin/posts/new lights "Add New", not "All Posts".
  const all = groups.flatMap((g) => g.items);
  const current = all
    .filter((i) => (i.href === '/admin' ? path === '/admin' : path === i.href || path.startsWith(`${i.href.replace(/\/en$/, '')}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <aside className="cms-side">
      <a className="cms-side-brand" href="/admin">
        <span className="logo" aria-hidden>
          W
        </span>
        <span>
          <strong>WeizChat</strong>
          <span className="sub">Content Manager</span>
        </span>
      </a>
      <nav aria-label="Admin">
        {groups.map((g, i) => (
          <div key={i} style={{ display: 'contents' }}>
            {g.label ? <div className="cms-side-label">{g.label}</div> : null}
            {g.items.map((item) => (
              <a
                key={item.href}
                className="cms-side-link"
                href={item.href}
                aria-current={current?.href === item.href ? 'page' : undefined}
              >
                <Icon d={ICONS[item.icon]} />
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className="cms-side-bottom">
        <a className="cms-side-link" href="/" target="_blank" rel="noreferrer">
          <Icon d={ICONS.site} />
          View site
        </a>
        <a className="cms-side-link" href="/admin/logout">
          <Icon d={ICONS.out} />
          Sign out
        </a>
        <div className="cms-side-version">WeizChat CMS v{version}</div>
      </div>
    </aside>
  );
}
