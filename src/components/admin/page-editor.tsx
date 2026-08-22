'use client';

import { useEffect, useState } from 'react';
import type { CmsSection, LandingPage } from '../../cms/schema';
import { SectionEditor } from './section-editor';
import { AreaField, ImageField, TextField, moveItem } from './fields';

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

const LOCALES = [
  { code: 'en', label: 'English', path: '/en' },
  { code: 'he', label: 'Hebrew', path: '/' },
] as const;

/**
 * The landing-page editor.
 *
 * Everything is edited in local state and written in one PUT, so a save is
 * atomic: the page never renders half of an edit. Leaving with unsaved
 * work triggers the browser's own warning rather than a custom modal that
 * can be dismissed by accident.
 */
export function PageEditor({ initial, locale }: { initial: LandingPage; locale: string }) {
  const [page, setPage] = useState<LandingPage>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(next: LandingPage) {
    setPage(next);
    setDirty(true);
    setStatus(null);
  }

  function replaceSection(index: number, next: CmsSection) {
    edit({ ...page, sections: page.sections.map((s, i) => (i === index ? next : s)) });
  }

  async function save(publish?: boolean) {
    setBusy(true);
    setStatus(null);
    const body: LandingPage = publish === undefined ? page : { ...page, published: publish };
    const res = await fetch(`/api/admin/page/${locale}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))) as { issues?: { path: unknown[]; message: string }[] };
      setStatus({
        kind: 'err',
        text: detail.issues?.length
          ? `Not saved — ${detail.issues[0]!.path.join('.')}: ${detail.issues[0]!.message}`
          : 'Not saved. Something went wrong.',
      });
      return;
    }
    const { page: saved } = (await res.json()) as { page: LandingPage };
    setPage(saved);
    setDirty(false);
    setStatus({ kind: 'ok', text: saved.published ? 'Saved and live.' : 'Saved as a draft — not visible to visitors.' });
  }

  async function revert() {
    if (!window.confirm('Discard everything and go back to the content the site shipped with?')) return;
    setBusy(true);
    const res = await fetch(`/api/admin/page/${locale}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      setStatus({ kind: 'err', text: 'Could not reset.' });
      return;
    }
    const { page: reset } = (await res.json()) as { page: LandingPage };
    setPage(reset);
    setDirty(false);
    setStatus({ kind: 'ok', text: 'Back to the built-in content.' });
  }

  const publicPath = LOCALES.find((l) => l.code === locale)?.path ?? '/';

  return (
    <>
      <div className="cms-bar">
        <h1>Landing page</h1>
        <div className="cms-field" style={{ minWidth: '9rem' }}>
          <select
            value={locale}
            aria-label="Language"
            onChange={(e) => {
              if (dirty && !window.confirm('You have unsaved changes. Leave them?')) return;
              // A full load, not a client push: the editor's state is
              // server-rendered per locale.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = `/admin/landing/${e.target.value}`;
            }}
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <label className="cms-toggle">
          <input
            type="checkbox"
            checked={page.published}
            onChange={(e) => edit({ ...page, published: e.target.checked })}
          />
          Published
        </label>

        <div className="cms-spacer" />
        {status ? (
          <span className={`cms-status ${status.kind === 'ok' ? 'cms-status-ok' : 'cms-status-err'}`} role="status">
            {status.text}
          </span>
        ) : dirty ? (
          <span className="cms-status">Unsaved changes</span>
        ) : null}
        <a className="cms-btn" href={`/admin/preview/${locale}`} target="_blank" rel="noreferrer">
          Preview
        </a>
        <a className="cms-btn" href={publicPath} target="_blank" rel="noreferrer">
          View live
        </a>
        <button type="button" className="cms-btn" onClick={revert} disabled={busy}>
          Reset
        </button>
        <button type="button" className="cms-btn cms-btn-primary" onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="cms-wrap">
        <div className="cms-card">
          <div className="cms-sec-head">
            <span className="cms-sec-id">SEO</span>
            <span style={{ fontWeight: 600 }}>Search and social</span>
          </div>
          <div className="cms-body">
            <TextField label="Meta title" value={page.seo.title} onChange={(title) => edit({ ...page, seo: { ...page.seo, title } })} />
            <AreaField
              label="Meta description"
              value={page.seo.description}
              onChange={(description) => edit({ ...page, seo: { ...page.seo, description } })}
            />
            <div className="cms-grid">
              <TextField
                label="Open Graph title (optional)"
                value={page.seo.ogTitle ?? ''}
                onChange={(v) => edit({ ...page, seo: { ...page.seo, ogTitle: v || undefined } })}
              />
              <TextField
                label="Canonical URL (optional)"
                value={page.seo.canonical ?? ''}
                onChange={(v) => edit({ ...page, seo: { ...page.seo, canonical: v || undefined } })}
              />
            </div>
            <AreaField
              label="Open Graph description (optional)"
              rows={2}
              value={page.seo.ogDescription ?? ''}
              onChange={(v) => edit({ ...page, seo: { ...page.seo, ogDescription: v || undefined } })}
            />
            <ImageField
              label="Share image"
              value={page.seo.ogImage ?? { src: '', alt: '' }}
              onChange={(ogImage) =>
                edit({ ...page, seo: { ...page.seo, ogImage: ogImage.src ? ogImage : undefined } })
              }
            />
          </div>
        </div>

        {page.sections.map((section, index) => (
          <div key={section.id} className="cms-card">
            <div className="cms-sec-head">
              <button
                type="button"
                className="cms-btn cms-btn-icon"
                aria-label={`Move ${SECTION_NAMES[section.id]} up`}
                disabled={index === 0}
                onClick={() => edit({ ...page, sections: moveItem(page.sections, index, index - 1) })}
              >
                ↑
              </button>
              <button
                type="button"
                className="cms-btn cms-btn-icon"
                aria-label={`Move ${SECTION_NAMES[section.id]} down`}
                disabled={index === page.sections.length - 1}
                onClick={() => edit({ ...page, sections: moveItem(page.sections, index, index + 1) })}
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
          Order here is the order on the page. A hidden section is not rendered at all — it is not
          on the page in a collapsed state, it is simply absent.
        </p>
      </div>
    </>
  );
}
