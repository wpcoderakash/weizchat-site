'use client';

import { useEffect, useId, useState } from 'react';
import type { CmsImage, CmsLink } from '../../cms/schema';

/** A labelled single-line input. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  // A generated id, so the label is programmatically tied to its input —
  // without it the field is unusable with a screen reader.
  const id = useId();
  return (
    <div className="cms-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

/** A labelled multi-line input, for anything that wraps on the page. */
export function AreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
}) {
  const id = useId();
  return (
    <div className="cms-field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/**
 * A link field: label, destination, and the two switches that decide
 * whether it renders and where it opens.
 */
export function LinkField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CmsLink;
  onChange: (next: CmsLink) => void;
}) {
  return (
    <div className="cms-item">
      <div className="cms-item-bar">
        <span className="cms-sec-id">{label}</span>
        <label className="cms-toggle">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          />
          Shown
        </label>
        <label className="cms-toggle">
          <input
            type="checkbox"
            checked={value.newTab}
            onChange={(e) => onChange({ ...value, newTab: e.target.checked })}
          />
          New tab
        </label>
      </div>
      <div className="cms-grid">
        <TextField label="Button text" value={value.label} onChange={(label2) => onChange({ ...value, label: label2 })} />
        <TextField
          label="Destination"
          value={value.href}
          onChange={(href) => onChange({ ...value, href })}
          placeholder="/pricing or https://…"
        />
      </div>
    </div>
  );
}

interface MediaFile {
  src: string;
  name: string;
  bytes: number;
}

/**
 * An image field with the media library attached: pick an existing file,
 * or upload a new one. Alt text sits beside the picker rather than behind
 * it, because an image saved without alt text is an accessibility defect
 * the editor should have to look at.
 */
export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CmsImage;
  onChange: (next: CmsImage) => void;
}) {
  const uploadId = useId();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void fetch('/api/admin/media')
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d: { files: MediaFile[] }) => setFiles(d.files))
      .catch(() => setError('Could not load the media library.'));
  }, [open]);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/admin/media', { method: 'POST', body });
    setBusy(false);
    if (!res.ok) {
      const { error: code } = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        code === 'too_large'
          ? 'That file is over 8 MB.'
          : code === 'unsupported_type'
            ? 'Only PNG, JPEG, GIF and WebP images can be uploaded.'
            : 'The upload failed.',
      );
      return;
    }
    const { file: saved } = (await res.json()) as { file: MediaFile };
    setFiles((current) => [saved, ...current]);
    onChange({ ...value, src: saved.src });
  }

  return (
    <div className="cms-item">
      <div className="cms-item-bar">
        <span className="cms-sec-id">{label}</span>
        <button type="button" className="cms-btn" onClick={() => setOpen(!open)}>
          {open ? 'Close library' : 'Change image'}
        </button>
      </div>

      {/* eslint-disable @next/next/no-img-element -- the admin previews
          arbitrary CMS paths; next/image would need every one configured,
          and none of this ships to a visitor. */}
      {value.src ? (
        <img src={value.src} alt="" style={{ maxWidth: '14rem', borderRadius: 6, display: 'block' }} />
      ) : null}

      <div className="cms-grid">
        <TextField label="Image path" value={value.src} onChange={(src) => onChange({ ...value, src })} />
        <TextField label="Alt text" value={value.alt} onChange={(alt) => onChange({ ...value, alt })} />
      </div>

      {open ? (
        <>
          <div className="cms-field">
            <label htmlFor={`${uploadId}-file`}>Upload a new image</label>
            <input
              id={`${uploadId}-file`}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </div>
          {error ? <p className="cms-status cms-status-err">{error}</p> : null}
          <div className="cms-media">
            {files.map((file) => (
              <button
                key={file.src}
                type="button"
                aria-pressed={file.src === value.src}
                onClick={() => onChange({ ...value, src: file.src })}
              >
                <img src={file.src} alt="" />
                <span>{file.name}</span>
              </button>
            ))}
            {files.length === 0 ? <p className="cms-note">No images yet.</p> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * Repeater controls: move, duplicate, delete.
 *
 * Buttons rather than drag-and-drop, deliberately. Move-up/move-down is
 * operable by keyboard and by screen reader with no extra work, whereas a
 * drag handle needs a keyboard alternative anyway to be usable — so this
 * is the accessible path built once instead of twice.
 */
export function ItemControls({
  index,
  count,
  onMove,
  onDuplicate,
  onRemove,
  label,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  label: string;
}) {
  return (
    <div className="cms-item-bar">
      <span className="cms-sec-id">
        {label} {index + 1}
      </span>
      <button
        type="button"
        className="cms-btn cms-btn-icon"
        aria-label={`Move ${label} ${index + 1} up`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        className="cms-btn cms-btn-icon"
        aria-label={`Move ${label} ${index + 1} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </button>
      <button type="button" className="cms-btn" onClick={() => onDuplicate(index)}>
        Duplicate
      </button>
      <button
        type="button"
        className="cms-btn cms-btn-danger"
        disabled={count <= 1}
        onClick={() => onRemove(index)}
      >
        Delete
      </button>
    </div>
  );
}

/** Moves an array element, returning a new array. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

/** A fresh id for a duplicated or added repeater item. */
export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
/* eslint-enable @next/next/no-img-element */
