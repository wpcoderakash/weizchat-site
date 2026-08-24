'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { richTextExtensions } from './rich-text-config';

/**
 * The rich editor for the CMS's markdown fields.
 *
 * What is stored is still markdown — the same string the MDX pipeline renders
 * on the public page. This is a view over it: TipTap parses the markdown on
 * open and serialises it back as you type, so the store never learns about
 * HTML or editor JSON and every existing document keeps working.
 *
 * `scripts/check-markdown-roundtrip.mjs` proves that every shipped document
 * survives that parse → serialise unchanged. Without it, the first person to
 * open the privacy policy and press save would silently drop its tables.
 *
 * The raw-markdown view stays one click away: some edits (a table, a tricky
 * link) are simply faster in the source, and a rich editor that traps you is
 * worse than no rich editor.
 */

type Mode = 'rich' | 'markdown';

export function RichMarkdownField({
  label,
  value,
  onChange,
  rows = 26,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
}) {
  const id = useId();
  const [mode, setMode] = useState<Mode>('rich');

  return (
    <div className="cms-field cms-rich">
      <div className="cms-rich-head">
        <label htmlFor={id}>{label}</label>
        <div className="cms-spacer" />
        <div className="cms-rich-modes" role="group" aria-label="Editor mode">
          <button
            type="button"
            onClick={() => setMode('rich')}
            aria-pressed={mode === 'rich'}
            className="cms-btn cms-btn-icon"
          >
            Rich text
          </button>
          <button
            type="button"
            onClick={() => setMode('markdown')}
            aria-pressed={mode === 'markdown'}
            className="cms-btn cms-btn-icon"
          >
            Markdown
          </button>
        </div>
      </div>

      {mode === 'rich' ? (
        <RichEditor id={id} value={value} onChange={onChange} />
      ) : (
        <textarea
          id={id}
          className="cms-markdown"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function RichEditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  // What this editor last emitted. Used to tell "the parent echoed my own
  // change back" from "the parent replaced the document" (Reset, or switching
  // locale), so typing is never interrupted by a re-parse.
  const emitted = useRef(value);

  const editor = useEditor({
    extensions: richTextExtensions,
    content: value,
    // Content is markdown, not HTML: say so, or TipTap parses `**bold**` as
    // literal text.
    contentType: 'markdown',
    // The admin is client-only; rendering it on the server first would only
    // buy a flash of unstyled editor.
    immediatelyRender: false,
    editorProps: { attributes: { id, class: 'cms-rich-surface', role: 'textbox' } },
    onUpdate({ editor: e }) {
      const md = e.getMarkdown();
      emitted.current = md;
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor || value === emitted.current) return;
    emitted.current = value;
    editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="cms-rich-surface cms-rich-loading">Loading editor…</div>;

  return (
    <>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  // Toolbar state has to re-render on every selection move, and TipTap's
  // state lives outside React — so subscribe to its transactions.
  const [, force] = useState(0);
  useEffect(() => {
    const bump = () => force((n) => n + 1);
    editor.on('transaction', bump);
    editor.on('selectionUpdate', bump);
    return () => {
      editor.off('transaction', bump);
      editor.off('selectionUpdate', bump);
    };
  }, [editor]);

  const setLink = useCallback(() => {
    const previous = (editor.getAttributes('link')['href'] as string | undefined) ?? '';
    const href = window.prompt('Link address (a path like /pricing, or a full https:// URL)', previous);
    if (href === null) return; // cancelled
    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  }, [editor]);

  const btn = (
    key: string,
    title: string,
    isActive: boolean,
    run: () => void,
    content: React.ReactNode,
  ) => (
    <button
      key={key}
      type="button"
      className="cms-rich-btn"
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      onMouseDown={(e) => e.preventDefault()} // keep the selection
      onClick={run}
    >
      {content}
    </button>
  );

  return (
    <div className="cms-rich-bar" role="toolbar" aria-label="Formatting">
      {btn('bold', 'Bold', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <strong>B</strong>)}
      {btn('italic', 'Italic', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <em>I</em>)}
      {btn('link', 'Link', editor.isActive('link'), setLink, <LinkIcon />)}
      <span className="cms-rich-sep" />
      {btn('h2', 'Heading', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
      {btn('h3', 'Sub-heading', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3')}
      <span className="cms-rich-sep" />
      {btn('ul', 'Bulleted list', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <ListIcon />)}
      {btn('ol', 'Numbered list', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1.')}
      {btn('quote', 'Quote', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '❞')}
      {btn('code', 'Code', editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), <code>{'<>'}</code>)}
      <span className="cms-rich-sep" />
      {btn('table', 'Insert table', editor.isActive('table'), () => editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run(), <TableIcon />)}
      <div className="cms-spacer" />
      {btn('undo', 'Undo', false, () => editor.chain().focus().undo().run(), '↶')}
      {btn('redo', 'Redo', false, () => editor.chain().focus().redo().run(), '↷')}
    </div>
  );
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden {...strokeProps}>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2A5 5 0 0 0 12.5 4.5l-1 1" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2A5 5 0 0 0 11.5 19.5l1-1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden {...strokeProps}>
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden {...strokeProps}>
      <path d="M3 5h18v14H3zM3 10h18M9 10v9M15 10v9" />
    </svg>
  );
}
