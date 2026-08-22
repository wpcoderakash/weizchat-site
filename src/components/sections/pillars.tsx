import type { CmsSection } from '../../cms/schema';
import { Link } from '../../i18n/navigation';

type Pillars = Extract<CmsSection, { id: 'pillars' }>;

/** The three glyphs a pillar may use. Named in content, drawn here. */
const ICONS: Record<'inbox' | 'ai' | 'bot', React.ReactNode> = {
  inbox: (
    <path d="M3 12l3-7h12l3 7v7H3v-7zm0 0h5l2 3h4l2-3h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  ),
  ai: (
    <path d="M12 3l2.2 6.8H21l-5.4 4 2 6.9-5.6-4.2-5.6 4.2 2-6.9L3 9.8h6.8L12 3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  ),
  bot: (
    <path d="M12 4v3m-6 3a6 6 0 0112 0v6H6v-6zm3 3h.01M15 13h.01M9 20h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  ),
};

/** Three pillars (§5.5): icon, two-line description, link to the solution page. */
export function Pillars({ data }: { data: Pillars }) {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <h2 className="text-3xl sm:text-4xl">{data.title}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {data.items.map((item) => (
            <div key={item.id} className="flex flex-col rounded-card border border-border bg-bg p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
                  {ICONS[item.icon]}
                </svg>
              </span>
              <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 flex-1 text-muted">{item.body}</p>
              <Link
                href={item.href}
                className="mt-4 flex items-center gap-1.5 font-semibold text-accent hover:text-accent-hover"
              >
                {data.linkLabel}
                {/* Mirrors with direction — a "forward" arrow in both scripts. */}
                <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" className="rtl:-scale-x-100">
                  <path d="M3 8h10m-4-4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
