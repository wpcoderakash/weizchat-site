/**
 * Markdown that arrives wearing its own fence.
 *
 * A document pasted out of a chat window, an AI answer or a documentation
 * viewer often carries the code fence that tool used to display it:
 *
 *     ```markdown
 *     ## Introduction
 *     ...
 *     ```
 *
 * Stored verbatim, that fence is not decoration — it tells the renderer the
 * whole document is a code sample, so the reader sees `## **Sub-processors**`
 * and a row of pipe characters instead of a heading and a table. It happened
 * to the published privacy policy on 2026-09-15, and the editor gives no hint
 * that three characters at each end are the problem.
 *
 * So unwrap it, but only in the one case where the intent is unambiguous: the
 * document IS a single fenced block, opened at the top and closed at the
 * bottom, with no other fence anywhere. A document that merely contains a code
 * sample has more than two fence markers and is left exactly alone — as is any
 * document where the fences are not the first and last thing in it.
 *
 * Pure and dependency-free so it can be checked without a server.
 */

/** A fence is three or more backticks, optionally followed by a language. */
const OPENING = /^`{3,}[A-Za-z0-9+#.-]*[ \t]*$/;
const CLOSING = /^`{3,}[ \t]*$/;

export function unwrapPastedFence(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed.startsWith('```')) return markdown;

  const lines = trimmed.split('\n');
  if (lines.length < 3) return markdown;

  const first = lines[0]!.trimEnd();
  const last = lines[lines.length - 1]!.trimEnd();
  if (!OPENING.test(first) || !CLOSING.test(last)) return markdown;

  // Exactly one pair: the fence wraps the document rather than sitting inside
  // it. Anything else is a real code sample and must survive untouched.
  const fences = lines.filter((line) => line.trimStart().startsWith('```')).length;
  if (fences !== 2) return markdown;

  return lines.slice(1, -1).join('\n').trim();
}
