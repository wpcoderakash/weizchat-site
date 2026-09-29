import Image from 'next/image';
import type { CmsSection } from '../../cms/schema';
import { Arrow } from '../ui/arrow';
import { CmsCta } from './cms-link';

type Crm = Extract<CmsSection, { id: 'crm' }>;

/**
 * §5.9 — the built-in CRM: cards, custom fields, tags, notes, history.
 *
 * Redesign pass 2: SHOWN, not only listed — beside the checklist sits the
 * real Customers screenshot from the CRM page itself (`preview`, loaded by
 * the section's own link). Without one the checklist takes its place.
 */
export function SimpleCrm({
  data,
  preview,
}: {
  data: Crm;
  preview: { src: string; alt: string } | null;
}) {
  const checklist = (
    <ul className={preview ? 'mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2' : 'card overflow-hidden bg-bg p-2 shadow-[var(--shadow-md)]'}>
      {data.features.map((feature) => (
        <li
          key={feature.id}
          className={
            preview
              ? 'flex items-center gap-3'
              : 'flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors duration-200 hover:bg-surface'
          }
        >
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <svg viewBox="0 0 20 20" width={14} height={14}>
              <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-medium">{feature.text}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="section border-y border-border bg-surface">
      <div
        className={`wrap grid items-center gap-12 lg:gap-16 ${
          preview ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : 'lg:grid-cols-2'
        }`}
      >
        <div data-reveal>
          <h2 className="display-2">{data.title}</h2>
          <p className="lede mt-5 max-w-lg">{data.body}</p>
          {preview ? checklist : null}
          <div className="mt-9">
            <CmsCta link={data.link} className="btn btn-secondary">
              <Arrow />
            </CmsCta>
          </div>
        </div>
        {preview ? (
          <div data-reveal style={{ '--i': 2 } as React.CSSProperties} className="shot-frame">
            <div aria-hidden="true" className="shot-bar">
              <span />
              <span />
              <span />
            </div>
            <Image
              src={preview.src}
              alt={preview.alt}
              width={2200}
              height={1375}
              sizes="(min-width: 1024px) 700px, 100vw"
              className="block h-auto w-full"
            />
          </div>
        ) : (
          <div data-reveal>{checklist}</div>
        )}
      </div>
    </section>
  );
}
