'use client';

import { useEffect, useRef, useState } from 'react';

interface MediaFile {
  src: string;
  name: string;
  bytes: number;
}

function formatBytes(n: number): string {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

/**
 * The media library page: grid, search, upload (button or drag-drop),
 * details, copy path, delete. Deleting is uploads-only — the shipped
 * product screenshots are repo content, and the API refuses them.
 */
export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const res = await fetch('/api/admin/media');
    if (res.ok) setFiles(((await res.json()) as { files: MediaFile[] }).files);
  }
  useEffect(() => {
    // A microtask hop keeps the state write asynchronous relative to the
    // effect body, which is what the set-state-in-effect rule polices.
    const id = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(id);
  }, []);

  async function upload(list: FileList | File[]) {
    setBusy(true);
    setNote(null);
    for (const file of Array.from(list)) {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/media', { method: 'POST', body });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        setNote(
          error === 'too_large'
            ? `${file.name} is over 8 MB.`
            : error === 'unsupported_type'
              ? `${file.name}: only PNG, JPEG, GIF and WebP.`
              : `${file.name}: upload failed.`,
        );
      }
    }
    setBusy(false);
    await refresh();
  }

  async function remove(file: MediaFile) {
    if (!file.src.startsWith('/media/')) {
      setNote('Shipped product screenshots cannot be deleted from here.');
      return;
    }
    if (!window.confirm(`Delete ${file.name}? Pages still pointing at it will show a broken image.`))
      return;
    const res = await fetch(`/api/admin/media?name=${encodeURIComponent(file.name)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSelected(null);
      await refresh();
    } else {
      setNote('Delete failed.');
    }
  }

  const visible = files.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <div className="cms-bar">
        <h1>Media</h1>
        <div className="cms-field" style={{ minWidth: '14rem' }}>
          <input
            type="search"
            placeholder="Search images"
            aria-label="Search images"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="cms-spacer" />
        {note ? (
          <span className="cms-status cms-status-err" role="status">
            {note}
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          hidden
          onChange={(e) => e.target.files && void upload(e.target.files)}
        />
        <button
          type="button"
          className="cms-btn cms-btn-primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      <div
        className="cms-wrap"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
      >
        {dragOver ? <p className="cms-note">Drop to upload…</p> : null}
        <div className="cms-media" style={{ maxHeight: 'none' }}>
          {visible.map((file) => (
            <button
              key={file.src}
              type="button"
              aria-pressed={selected?.src === file.src}
              onClick={() => setSelected(file)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary paths */}
              <img src={file.src} alt="" />
              <span>{file.name}</span>
            </button>
          ))}
          {visible.length === 0 ? <p className="cms-note">No images match.</p> : null}
        </div>

        {selected ? (
          <div className="cms-card">
            <div className="cms-sec-head">
              <span style={{ fontWeight: 600 }}>{selected.name}</span>
              <span className="cms-sec-id">{formatBytes(selected.bytes)}</span>
              <div className="cms-spacer" />
              <button
                type="button"
                className="cms-btn"
                onClick={() => void navigator.clipboard.writeText(selected.src).catch(() => undefined)}
              >
                Copy path
              </button>
              <button
                type="button"
                className="cms-btn cms-btn-danger"
                onClick={() => void remove(selected)}
              >
                Delete
              </button>
            </div>
            <div className="cms-body">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
              <img src={selected.src} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} />
              <p className="cms-note" style={{ fontFamily: 'var(--font-mono)' }}>
                {selected.src}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
