'use client';

import type { CmsImage, CmsLink } from '../../cms/schema';
import type { Field, FieldGroup } from '../../cms/descriptors';
import { AreaField, ImageField, ItemControls, LinkField, TextField, moveItem } from './fields';

/**
 * The generic document form: renders a page kind's field descriptors
 * against its document. Get/set work by dot path, immutably, so one
 * component serves every registry page — a new page kind is a descriptor
 * list, not a new editor.
 */

function getPath(value: unknown, path: string): unknown {
  if (path === '') return value;
  return path.split('.').reduce<unknown>((node, key) => {
    if (node === null || typeof node !== 'object') return undefined;
    return (node as Record<string, unknown>)[key];
  }, value);
}

function setPath(value: unknown, path: string, next: unknown): unknown {
  if (path === '') return next;
  const [head, ...rest] = path.split('.');
  const restPath = rest.join('.');
  if (Array.isArray(value)) {
    const index = Number(head);
    return value.map((item, i) => (i === index ? setPath(item, restPath, next) : item));
  }
  const obj = (value ?? {}) as Record<string, unknown>;
  return { ...obj, [head!]: setPath(obj[head!], restPath, next) };
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const current = getPath(value, field.path);

  switch (field.kind) {
    case 'text':
      return (
        <TextField
          label={field.label}
          value={String(current ?? '')}
          onChange={(v) => onChange(setPath(value, field.path, v))}
        />
      );
    case 'area': {
      if (field.optional) {
        const has = current !== null && current !== undefined;
        return (
          <div className="cms-item">
            <label className="cms-toggle">
              <input
                type="checkbox"
                checked={has}
                onChange={(e) =>
                  onChange(setPath(value, field.path, e.target.checked ? '' : null))
                }
              />
              {field.label}
            </label>
            {has ? (
              <AreaField
                label={field.label}
                rows={field.rows ?? 3}
                value={String(current ?? '')}
                onChange={(v) => onChange(setPath(value, field.path, v))}
              />
            ) : null}
          </div>
        );
      }
      return (
        <AreaField
          label={field.label}
          rows={field.rows ?? 3}
          value={String(current ?? '')}
          onChange={(v) => onChange(setPath(value, field.path, v))}
        />
      );
    }
    case 'markdown':
      return (
        <div className="cms-field">
          <label>{field.label}</label>
          <textarea
            className="cms-markdown"
            rows={26}
            value={String(current ?? '')}
            onChange={(e) => onChange(setPath(value, field.path, e.target.value))}
          />
        </div>
      );
    case 'toggle':
      return (
        <div>
          <label className="cms-toggle">
            <input
              type="checkbox"
              checked={Boolean(current)}
              onChange={(e) => onChange(setPath(value, field.path, e.target.checked))}
            />
            {field.label}
          </label>
          {field.hint ? <p className="cms-note">{field.hint}</p> : null}
        </div>
      );
    case 'link':
      return (
        <LinkField
          label={field.label}
          value={current as CmsLink}
          onChange={(v) => onChange(setPath(value, field.path, v))}
        />
      );
    case 'image': {
      if (field.optional) {
        const has = current !== null && current !== undefined;
        return (
          <div className="cms-item">
            <label className="cms-toggle">
              <input
                type="checkbox"
                checked={has}
                onChange={(e) =>
                  onChange(setPath(value, field.path, e.target.checked ? { src: '', alt: '' } : null))
                }
              />
              {field.label}
            </label>
            {has ? (
              <ImageField
                label={field.label}
                value={current as CmsImage}
                onChange={(v) => onChange(setPath(value, field.path, v))}
              />
            ) : null}
          </div>
        );
      }
      return (
        <ImageField
          label={field.label}
          value={current as CmsImage}
          onChange={(v) => onChange(setPath(value, field.path, v))}
        />
      );
    }
    case 'repeater': {
      const items = (current as unknown[]) ?? [];
      return (
        <div className="cms-item">
          <span className="cms-sec-id">{field.label}</span>
          {items.map((item, index) => (
            <div key={index} className="cms-item">
              <ItemControls
                index={index}
                count={items.length}
                label={field.itemLabel}
                onMove={(from, to) => onChange(setPath(value, field.path, moveItem(items, from, to)))}
                onDuplicate={(i) => {
                  const next = [...items];
                  const copy =
                    typeof items[i] === 'object' && items[i] !== null
                      ? { ...(items[i] as Record<string, unknown>), id: `dup-${Math.random().toString(36).slice(2, 8)}` }
                      : items[i];
                  next.splice(i + 1, 0, copy);
                  onChange(setPath(value, field.path, next));
                }}
                onRemove={(i) => onChange(setPath(value, field.path, items.filter((_, x) => x !== i)))}
              />
              {field.fields.map((sub) => (
                <FieldRow
                  key={sub.path || 'value'}
                  field={{ ...sub, path: sub.path === '' ? String(index) : `${index}.${sub.path}` }}
                  value={items}
                  onChange={(nextItems) => onChange(setPath(value, field.path, nextItems))}
                />
              ))}
            </div>
          ))}
          <button
            type="button"
            className="cms-btn"
            onClick={() => onChange(setPath(value, field.path, [...items, field.newItem()]))}
          >
            Add {field.itemLabel.toLowerCase()}
          </button>
        </div>
      );
    }
  }
}

export function DocForm({
  groups,
  value,
  onChange,
}: {
  groups: FieldGroup[];
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className="cms-card">
          <div className="cms-sec-head">
            <span style={{ fontWeight: 600 }}>{group.title}</span>
          </div>
          <div className="cms-body">
            {group.fields.map((field) => (
              <FieldRow key={field.path} field={field} value={value} onChange={onChange} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
