import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: 'WeizChat CMS',
  // The editor is not a page for the public or for search engines.
  robots: { index: false, follow: false },
};

/**
 * The admin sits outside the public site's locale layout on purpose: it is
 * a tool, always LTR, with its own chrome, and it must not inherit the
 * marketing nav or the cookie banner.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="cms">{children}</div>;
}
