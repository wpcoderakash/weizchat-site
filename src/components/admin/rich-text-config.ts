import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { TableKit } from '@tiptap/extension-table';
import type { Extensions } from '@tiptap/core';

/**
 * The one extension set the rich editor and its verification harness share.
 *
 * They MUST be the same list: the harness proves that every markdown document
 * the site ships survives parse → serialise with this exact configuration, so
 * a construct the editor cannot represent is caught by a failing check rather
 * than by an editor quietly deleting a table from the privacy policy.
 *
 * Tables are included for that reason — the privacy policy has them.
 */
export const richTextExtensions: Extensions = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: false,
      HTMLAttributes: { rel: 'noreferrer', target: null },
    },
  }),
  Markdown,
  TableKit,
];

/**
 * The tolerance the round-trip check allows, and the only one.
 *
 * The serialiser reflows markdown it did not change: it pads table cells to
 * align them, and it emits each paragraph or list item on one line where the
 * source hard-wrapped it at eighty columns. Both render identically — a soft
 * wrap is a space in markdown — so comparing raw bytes would fail on every
 * document and teach us to ignore the check.
 *
 * What is deliberately NOT normalised, because a change there is a real
 * change: fenced code (byte-exact), trailing double spaces (a hard break),
 * leading indentation (list nesting depth), and every block marker.
 */
export function normalizeMarkdown(md: string): string {
  const out: string[] = [];
  let inFence = false;

  for (const raw of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      out.push(raw.trimEnd());
      continue;
    }
    if (inFence) {
      out.push(raw);
      continue;
    }

    // A hard break is two trailing spaces; anything else trailing is noise.
    const hardBreak = /[ \t]{2,}$/.test(raw);
    const line = raw.replace(/[ \t]+$/, '').replace(/[ \t]{2,}/g, ' ');

    if (line.trim() === '') {
      out.push('');
      continue;
    }

    if (/^\s*\|/.test(line)) {
      // Table row: drop the alignment padding, keep the cells.
      out.push(
        line
          .trim()
          .split('|')
          .map((cell) => (/^\s*:?-+:?\s*$/.test(cell) ? '---' : cell.trim()))
          .join('|'),
      );
      continue;
    }

    // Leading indentation is kept on block starts: it carries list nesting.
    const startsBlock = /^[ \t]*([-*+][ \t]|\d+[.)][ \t]|#{1,6}[ \t]|>|={3,}$|-{3,}$|\*{3,}$)/.test(line);
    const previous = out[out.length - 1];
    const canJoin =
      !startsBlock && previous !== undefined && previous !== '' && !previous.endsWith('  ');

    if (canJoin) {
      out[out.length - 1] = `${previous} ${line.trim()}`;
    } else {
      const indent = startsBlock ? (line.match(/^[ \t]*/)?.[0] ?? '') : '';
      out.push(indent + line.trim() + (hardBreak ? '  ' : ''));
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
