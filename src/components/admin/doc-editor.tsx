'use client';

import { useEffect, useState } from 'react';
import type { DocStatus } from '../../cms/docs';
import { GROUPS, globalGroups } from '../../cms/descriptors';
import type { CmsSeo } from '../../cms/schema';
import { DocForm } from './doc-form';
import { LandingBody } from './landing-body';
import { AreaField, ImageField, TextField } from './fields';

/**
 * The editor shell every document shares: draft state, Save draft,
 * Publish, Unpublish, Preview, View live, Reset. The body is the page
 * kind's field descriptors — or the landing page's bespoke section list.
 *
 * The workflow is WordPress's, deliberately: SAVE writes the draft and
 * changes nothing public; PUBLISH copies the draft over the live version
 * and revalidates the page. The status line never says "live" unless the
 * server confirmed the publish, because the API revalidates before it
 * responds.
 */
export function DocEditor({
  kind,
  apiKind,
  slug,
  locale,
  title,
  publicPath,
  initial,
  initialStatus,
  hasSeo = true,
}: {
  /** The registry page kind — picks the field descriptors. */
  kind: string;
  /** 'page' or 'global' — the API segment. */
  apiKind: 'page' | 'global';
  slug: string;
  locale: string;
  title: string;
  publicPath: string;
  initial: unknown;
  initialStatus: DocStatus;
  hasSeo?: boolean;
}) {
  const [doc, setDoc] = useState<unknown>(initial);
  const [status, setStatus] = useState(initialStatus);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const api = `/api/admin/docs/${apiKind}/${slug}/${locale}`;

  function edit(next: unknown) {
    setDoc(next);
    setDirty(true);
    setNote(null);
  }

  async function call(init: RequestInit): Promise<Response | null> {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(api, {
        ...init,
        headers: { 'content-type': 'application/json' },
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as {
          issues?: { path: string; message: string }[];
        };
        setNote({
          kind: 'err',
          text: detail.issues?.length
            ? `Not saved — ${detail.issues[0]!.path}: ${detail.issues[0]!.message}`
            : 'That did not work.',
        });
        return null;
      }
      return res;
    } catch {
      setNote({ kind: 'err', text: 'That did not work.' });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft(): Promise<boolean> {
    const res = await call({ method: 'PUT', body: JSON.stringify(doc) });
    if (!res) return false;
    const data = (await res.json()) as { status: DocStatus };
    setStatus(data.status);
    setDirty(false);
    setNote({ kind: 'ok', text: 'Draft saved. Not live yet.' });
    return true;
  }

  async function publish() {
    // Publish always publishes what is on screen: save first.
    if (dirty && !(await saveDraft())) return;
    const res = await call({ method: 'POST', body: JSON.stringify({ action: 'publish' }) });
    if (!res) return;
    const data = (await res.json()) as { status: DocStatus };
    setStatus(data.status);
    setNote({ kind: 'ok', text: 'Published — the public page is updating.' });
  }

  async function unpublish() {
    const res = await call({ method: 'POST', body: JSON.stringify({ action: 'unpublish' }) });
    if (!res) return;
    const data = (await res.json()) as { status: DocStatus };
    setStatus(data.status);
    setNote({ kind: 'ok', text: 'Unpublished — visitors see the built-in content.' });
  }

  async function reset() {
    if (!window.confirm('Discard the stored draft AND published version, back to the shipped content?'))
      return;
    const res = await call({ method: 'DELETE' });
    if (!res) return;
    const data = (await res.json()) as { doc: unknown; status: DocStatus };
    setDoc(data.doc);
    setStatus(data.status);
    setDirty(false);
    setNote({ kind: 'ok', text: 'Back to the built-in content.' });
  }

  const groups = kind === 'global' ? globalGroups : GROUPS[kind];
  const seo = hasSeo ? ((doc as { seo?: CmsSeo }).seo ?? null) : null;

  return (
    <>
      <div className="cms-bar">
        <a className="cms-btn" href="/admin">
          ←
        </a>
        <h1>{title}</h1>
        <span className="cms-sec-id">{locale.toUpperCase()}</span>
        <span className={status.isPublished ? 'cms-badge-live' : 'cms-badge-draft'}>
          {status.isPublished ? (status.dirty || dirty ? 'Live · draft edited' : 'Live') : 'Not published'}
        </span>

        <div className="cms-spacer" />
        {note ? (
          <span className={`cms-status ${note.kind === 'ok' ? 'cms-status-ok' : 'cms-status-err'}`} role="status">
            {note.text}
          </span>
        ) : dirty ? (
          <span className="cms-status">Unsaved changes</span>
        ) : null}
        <a
          className="cms-btn"
          href={`/api/admin/preview?redirect=${encodeURIComponent(publicPath)}`}
          target="_blank"
          rel="noreferrer"
        >
          Preview draft
        </a>
        <a className="cms-btn" href={publicPath} target="_blank" rel="noreferrer">
          View live
        </a>
        <button type="button" className="cms-btn" onClick={reset} disabled={busy}>
          Reset
        </button>
        {status.isPublished ? (
          <button type="button" className="cms-btn" onClick={unpublish} disabled={busy}>
            Unpublish
          </button>
        ) : null}
        <button type="button" className="cms-btn" onClick={() => void saveDraft()} disabled={busy}>
          Save draft
        </button>
        <button type="button" className="cms-btn cms-btn-primary" onClick={publish} disabled={busy}>
          {busy ? 'Working…' : 'Publish'}
        </button>
      </div>

      <div className="cms-wrap">
        {seo ? (
          <div className="cms-card">
            <div className="cms-sec-head">
              <span className="cms-sec-id">SEO</span>
              <span style={{ fontWeight: 600 }}>Search and social</span>
            </div>
            <div className="cms-body">
              <TextField
                label="Meta title"
                value={seo.title}
                onChange={(v) => edit({ ...(doc as object), seo: { ...seo, title: v } })}
              />
              <AreaField
                label="Meta description"
                value={seo.description}
                onChange={(v) => edit({ ...(doc as object), seo: { ...seo, description: v } })}
              />
              <div className="cms-grid">
                <TextField
                  label="Open Graph title (optional)"
                  value={seo.ogTitle ?? ''}
                  onChange={(v) => edit({ ...(doc as object), seo: { ...seo, ogTitle: v || undefined } })}
                />
                <TextField
                  label="Canonical URL (optional)"
                  value={seo.canonical ?? ''}
                  onChange={(v) => edit({ ...(doc as object), seo: { ...seo, canonical: v || undefined } })}
                />
              </div>
              <AreaField
                label="Open Graph description (optional)"
                rows={2}
                value={seo.ogDescription ?? ''}
                onChange={(v) => edit({ ...(doc as object), seo: { ...seo, ogDescription: v || undefined } })}
              />
              <ImageField
                label="Share image"
                value={seo.ogImage ?? { src: '', alt: '' }}
                onChange={(img) =>
                  edit({ ...(doc as object), seo: { ...seo, ogImage: img.src ? img : undefined } })
                }
              />
              <label className="cms-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(seo.noindex)}
                  onChange={(e) =>
                    edit({ ...(doc as object), seo: { ...seo, noindex: e.target.checked || undefined } })
                  }
                />
                Hide from search engines (noindex)
              </label>
            </div>
          </div>
        ) : null}

        {kind === 'landing' ? (
          <LandingBody value={doc} onChange={edit} />
        ) : groups ? (
          <DocForm groups={groups} value={doc} onChange={edit} />
        ) : null}
      </div>
    </>
  );
}
