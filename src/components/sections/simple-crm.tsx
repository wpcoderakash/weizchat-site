import type { CmsSection } from '../../cms/schema';
import { CmsCta } from './cms-link';

type Crm = Extract<CmsSection, { id: 'crm' }>;

/** §5.9 — the built-in CRM: cards, custom fields, tags, notes, history. */
export function SimpleCrm({ data }: { data: Crm }) {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <h2 className="text-3xl sm:text-4xl">{data.title}</h2>
          <p className="mt-4 max-w-lg text-lg text-muted">{data.body}</p>
          <div className="mt-6">
            <CmsCta link={data.link} className="font-semibold text-accent hover:text-accent-hover" />
          </div>
        </div>
        <ul className="grid gap-3 self-center">
          {data.features.map((feature) => (
            <li key={feature.id} className="flex items-center gap-3 rounded-card border border-border bg-bg px-5 py-3">
              <svg viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" className="shrink-0 text-ok">
                <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="font-medium">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
