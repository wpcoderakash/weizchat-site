'use client';

import { useState } from 'react';
import type { CmsSection, LandingPage } from '../../cms/schema';
import { SectionEditor } from './section-editor';
import { moveItem } from './fields';

/** Human names for the section ids, so the list is not a list of slugs. */
const SECTION_NAMES: Record<CmsSection['id'], string> = {
  hero: 'Hero',
  trust: 'Trust strip',
  problem: 'The problem',
  pillars: 'Three pillars',
  ai: 'AI agent deep-dive',
  platform: 'Built on the official platform',
  useCases: 'Use cases by department',
  crm: 'Simple CRM',
  testimonials: 'Testimonials',
  pricing: 'Pricing preview',
  faq: 'FAQ',
  finalCta: 'Final call to action',
};

/**
 * The landing page's bespoke editor body: its twelve sections with
 * reorder, show/hide and per-section fields. Everything else — SEO, the
 * draft/publish bar — comes from the shared DocEditor shell.
 */
export function LandingBody({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const page = value as LandingPage;
  const [open, setOpen] = useState<string | null>(null);

  function replaceSection(index: number, next: CmsSection) {
    onChange({ ...page, sections: page.sections.map((s, i) => (i === index ? next : s)) });
  }

  return (
    <>
      {page.sections.map((section, index) => (
        <div key={section.id} className="cms-card">
          <div className="cms-sec-head">
            <button
              type="button"
              className="cms-btn cms-btn-icon"
              aria-label={`Move ${SECTION_NAMES[section.id]} up`}
              disabled={index === 0}
              onClick={() => onChange({ ...page, sections: moveItem(page.sections, index, index - 1) })}
            >
              ↑
            </button>
            <button
              type="button"
              className="cms-btn cms-btn-icon"
              aria-label={`Move ${SECTION_NAMES[section.id]} down`}
              disabled={index === page.sections.length - 1}
              onClick={() => onChange({ ...page, sections: moveItem(page.sections, index, index + 1) })}
            >
              ↓
            </button>
            <button
              type="button"
              className="cms-title"
              aria-expanded={open === section.id}
              onClick={() => setOpen(open === section.id ? null : section.id)}
            >
              {SECTION_NAMES[section.id]}
            </button>
            {!section.visible ? <span className="cms-hidden-badge">Hidden</span> : null}
            <span className="cms-sec-id">{section.id}</span>
            <label className="cms-toggle">
              <input
                type="checkbox"
                checked={section.visible}
                onChange={(e) => replaceSection(index, { ...section, visible: e.target.checked })}
              />
              Show
            </label>
          </div>
          {open === section.id ? (
            <div className="cms-body">
              <SectionEditor section={section} onChange={(next) => replaceSection(index, next)} />
            </div>
          ) : null}
        </div>
      ))}

      <p className="cms-note">
        Order here is the order on the page. A hidden section is not rendered at all — it is not on
        the page in a collapsed state, it is simply absent.
      </p>
    </>
  );
}
