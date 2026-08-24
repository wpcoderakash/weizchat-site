/**
 * The rich editor's safety net.
 *
 * The CMS stores markdown. The rich editor parses that markdown into a
 * ProseMirror document and serialises it back as you type, so any construct
 * the editor cannot represent would be silently DESTROYED the first time
 * someone opens a document and saves — the privacy policy's tables being the
 * obvious casualty.
 *
 * This asserts the opposite: every markdown document the site ships survives
 * parse → serialise with the editor's own extension set. It runs in plain
 * Node — the schema and the markdown manager need no DOM.
 *
 * Cosmetic reflow is allowed (the serialiser pads table cells to align them);
 * `normalizeMarkdown` is where that tolerance is defined, and nothing else.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getSchema } from '@tiptap/core';
import { MarkdownManager } from '@tiptap/markdown';
import { richTextExtensions, normalizeMarkdown } from '../src/components/admin/rich-text-config.ts';

const ROOT = process.cwd();

/** Strip frontmatter the same way src/cms/defaults.ts does. */
function body(raw) {
  if (!raw.startsWith('---')) return raw.trim();
  const end = raw.indexOf('\n---', 3);
  return end === -1 ? raw.trim() : raw.slice(end + 4).trim();
}

/** Every markdown body the CMS can open in the rich editor. */
function documents() {
  const out = [];
  // Legal bodies sit directly under content/legal; articles under
  // content/articles/<collection> (see defaults.ts mdxPostFiles).
  for (const dir of ['legal', 'articles/blog', 'articles/information-center']) {
    const full = path.join(ROOT, 'src/content', dir);
    if (!fs.existsSync(full)) continue;
    for (const file of fs.readdirSync(full).filter((f) => f.endsWith('.mdx'))) {
      out.push({
        name: `${dir}/${file}`,
        markdown: body(fs.readFileSync(path.join(full, file), 'utf8')),
      });
    }
  }
  // Anything already written through the CMS counts too: it is what an editor
  // will reopen tomorrow.
  const store = path.join(ROOT, 'content-store');
  for (const kind of ['page', 'post']) {
    const dir = path.join(store, kind);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      try {
        const doc = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        for (const which of ['draft', 'published']) {
          const md = doc?.[which]?.body;
          if (typeof md === 'string' && md.trim()) {
            out.push({ name: `store/${kind}/${file}#${which}`, markdown: md.trim() });
          }
        }
      } catch {
        // A malformed envelope is the loaders' problem, not this check's.
      }
    }
  }
  return out;
}

const docs = documents();
if (docs.length === 0) {
  console.error('FAIL  no markdown documents found — this harness is looking in the wrong place');
  process.exit(1);
}

const schema = getSchema(richTextExtensions);
const manager = new MarkdownManager({ schema, extensions: richTextExtensions });

let fails = 0;
for (const doc of docs) {
  let after;
  try {
    const parsed = manager.parse(doc.markdown);
    const node = parsed?.type ? parsed : schema.nodeFromJSON(parsed);
    after = manager.serialize(node);
  } catch (error) {
    console.log(`FAIL  ${doc.name} — the editor could not parse it: ${String(error).slice(0, 120)}`);
    fails++;
    continue;
  }

  const before = normalizeMarkdown(doc.markdown);
  const round = normalizeMarkdown(after);
  const same = before === round;
  console.log(`${same ? 'PASS' : 'FAIL'}  ${doc.name}`);
  if (!same) {
    fails++;
    const a = before.split('\n');
    const c = round.split('\n');
    for (let i = 0; i < Math.max(a.length, c.length); i++) {
      if (a[i] !== c[i]) {
        console.log(`        first difference at line ${i + 1}`);
        console.log(`        stored:    ${JSON.stringify(a[i] ?? '(end of document)')}`);
        console.log(`        would be:  ${JSON.stringify(c[i] ?? '(end of document)')}`);
        break;
      }
    }
  }
}

console.log(
  fails === 0
    ? `\nMARKDOWN ROUND-TRIP PASSED (${docs.length} documents)`
    : `\n${fails} of ${docs.length} documents would be altered by the rich editor`,
);
process.exit(fails === 0 ? 0 : 1);
