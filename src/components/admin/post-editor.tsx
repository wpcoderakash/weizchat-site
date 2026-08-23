'use client';

import { useEffect, useState } from 'react';
import type { DocStatus } from '../../cms/docs';
import type { PostDoc } from '../../cms/site-schema';
import type { Collection } from '../../cms/posts';
import { AreaField, ImageField, TextField } from './fields';

/**
 * The post editor: title, description, date, tags, featured image, and a
 * markdown body rendered by the same pipeline as the shipped articles.
 * Draft/publish works exactly like pages; the public URL is derived from
 * the collection, slug and locale.
 */
export function PostEditor({
  isNew,
  collection: initialCollection,
  slug: initialSlug,
  locale: initialLocale,
  initial,
  initialStatus,
}: {
  isNew: boolean;
  collection: Collection;
  slug: string;
  locale: string;
  initial: PostDoc;
  initialStatus: DocStatus;
}) {
  const [collection, setCollection] = useState<Collection>(initialCollection);
  const [slug, setSlug] = useState(initialSlug);
  const [locale, setLocale] = useState(initialLocale);
  const [doc, setDoc] = useState<PostDoc>(initial);
  const [status, setStatus] = useState(initialStatus);
  const [locked, setLocked] = useState(!isNew);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [tagsText, setTagsText] = useState(initial.tags.join(', '));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(next: Partial<PostDoc>) {
    setDoc((d) => ({ ...d, ...next }));
    setDirty(true);
    setNote(null);
  }

  const key = { collection, slug, locale };
  const publicPath = `${locale === 'he' ? '/heb' : ''}/${collection}/${slug}`;

  /** Slug from the title: what an editor would type by hand anyway. */
  function slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);
  }

  async function call(method: string, body: unknown): Promise<Response | null> {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/admin/posts', {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as {
          issues?: { path: string; message: string }[];
          error?: string;
        };
        setNote({
          kind: 'err',
          text: detail.issues?.length
            ? `Not saved — ${detail.issues[0]!.path}: ${detail.issues[0]!.message}`
            : `That did not work (${detail.error ?? 'error'}).`,
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
    const finalSlug = slug || slugify(doc.title);
    if (!finalSlug) {
      setNote({ kind: 'err', text: 'Give the post a title first.' });
      return false;
    }
    setSlug(finalSlug);
    const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
    const body = { key: { collection, slug: finalSlug, locale }, doc: { ...doc, tags } };
    const res = await call('PUT', body);
    if (!res) return false;
    const data = (await res.json()) as { status: DocStatus };
    setStatus(data.status);
    setDoc((d) => ({ ...d, tags }));
    setDirty(false);
    setLocked(true);
    setNote({ kind: 'ok', text: 'Draft saved. Not live yet.' });
    return true;
  }

  async function publish() {
    if ((dirty || !status.hasDraft) && !(await saveDraft())) return;
    const res = await call('POST', { key: { ...key, slug: slug || slugify(doc.title) }, action: 'publish' });
    if (!res) return;
    setStatus(((await res.json()) as { status: DocStatus }).status);
    setNote({ kind: 'ok', text: 'Published — the public page is updating.' });
  }

  async function unpublish() {
    const res = await call('POST', { key, action: 'unpublish' });
    if (!res) return;
    setStatus(((await res.json()) as { status: DocStatus }).status);
    setNote({ kind: 'ok', text: 'Unpublished.' });
  }

  async function remove() {
    if (!window.confirm('Delete this post from the CMS? A built-in file version, if one exists, comes back.'))
      return;
    const res = await call('DELETE', { key });
    if (!res) return;
    // A full load: the posts list is server-rendered from the store.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/admin/posts';
  }

  return (
    <>
      <div className="cms-bar">
        <a className="cms-btn" href="/admin/posts">
          ←
        </a>
        <h1>{isNew && !locked ? 'New post' : doc.title || 'Post'}</h1>
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
        {locked ? (
          <>
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
            <button type="button" className="cms-btn cms-btn-danger" onClick={remove} disabled={busy}>
              Delete
            </button>
            {status.isPublished ? (
              <button type="button" className="cms-btn" onClick={unpublish} disabled={busy}>
                Unpublish
              </button>
            ) : null}
          </>
        ) : null}
        <button type="button" className="cms-btn" onClick={() => void saveDraft()} disabled={busy}>
          Save draft
        </button>
        <button type="button" className="cms-btn cms-btn-primary" onClick={publish} disabled={busy}>
          {busy ? 'Working…' : 'Publish'}
        </button>
      </div>

      <div className="cms-wrap cms-wrap-narrow">
        <div className="cms-card">
          <div className="cms-sec-head">
            <span style={{ fontWeight: 600 }}>Post</span>
          </div>
          <div className="cms-body">
            <div className="cms-grid">
              <div className="cms-field">
                <label htmlFor="post-collection">Collection</label>
                <select
                  id="post-collection"
                  value={collection}
                  disabled={locked}
                  onChange={(e) => setCollection(e.target.value as Collection)}
                >
                  <option value="blog">Blog</option>
                  <option value="information-center">Information center</option>
                </select>
              </div>
              <div className="cms-field">
                <label htmlFor="post-locale">Language</label>
                <select
                  id="post-locale"
                  value={locale}
                  disabled={locked}
                  onChange={(e) => setLocale(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="he">Hebrew</option>
                </select>
              </div>
            </div>
            <TextField label="Title" value={doc.title} onChange={(title) => edit({ title })} />
            <AreaField
              label="Description (listing + meta description)"
              rows={2}
              value={doc.description}
              onChange={(description) => edit({ description })}
            />
            <div className="cms-grid">
              <div className="cms-field">
                <label htmlFor="post-date">Date</label>
                <input
                  id="post-date"
                  type="date"
                  value={doc.date}
                  onChange={(e) => {
                    edit({ date: e.target.value });
                  }}
                />
              </div>
              <TextField label="Tags (comma-separated)" value={tagsText} onChange={(v) => { setTagsText(v); setDirty(true); }} />
            </div>
            <div className="cms-item">
              <label className="cms-toggle">
                <input
                  type="checkbox"
                  checked={doc.image !== null}
                  onChange={(e) => edit({ image: e.target.checked ? { src: '', alt: '' } : null })}
                />
                Featured image
              </label>
              {doc.image ? (
                <ImageField label="Featured image" value={doc.image} onChange={(image) => edit({ image })} />
              ) : null}
            </div>
            <label className="cms-toggle">
              <input
                type="checkbox"
                checked={Boolean(doc.noindex)}
                onChange={(e) => edit({ noindex: e.target.checked || undefined })}
              />
              Hide from search engines (noindex)
            </label>
          </div>
        </div>

        <div className="cms-card">
          <div className="cms-sec-head">
            <span style={{ fontWeight: 600 }}>Body (markdown)</span>
          </div>
          <div className="cms-body">
            <textarea
              aria-label="Body"
              className="cms-markdown"
              rows={30}
              value={doc.body}
              onChange={(e) => edit({ body: e.target.value })}
            />
          </div>
        </div>
      </div>
    </>
  );
}
