/**
 * No page may imply a free trial exists.
 *
 * WeizChat has no trial and no checkout: registering creates a workspace that
 * is not yet subscribed (app ADR-0060). For months the header, the hero and
 * every tool, article and solution page said "Start free trial" anyway — a
 * promise the product could not keep. This scans every rendered page, in both
 * languages, so the words cannot come back through a default, a new page or a
 * copied component.
 *
 *   node scripts/check-no-trial.mjs                     against a built server (:4100)
 *   BASE=https://www.weiz.chat node scripts/…           against production, which also
 *                                                       covers text stored in the CMS
 */
import { readFile } from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://localhost:4100';
const pages = await readFile(new URL('./check-pages.mjs', import.meta.url), 'utf8');
const paths = [...pages.matchAll(/^\s+'(\/[^']*)',?\s*$/gm)].map((m) => m[1]);
if (paths.length < 20) throw new Error('could not read the page list from check-pages.mjs');

const TRIAL = /free trial|start (?:your |a )?trial|\d+.day trial|trial period|ניסיון חינם|תקופת ניסיון/gi;

let bad = 0;
let seen = 0;
for (const prefix of ['', '/heb']) {
  for (const path of paths) {
    const url = BASE + (prefix + (path === '/' ? '' : path) || '/');
    const res = await fetch(url, { redirect: 'follow' }).catch(() => null);
    if (!res?.ok) continue;
    seen += 1;
    const text = (await res.text())
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    const found = text.match(TRIAL);
    if (found) {
      bad += 1;
      console.log(`FAIL  ${prefix + path} — “${[...new Set(found.map((s) => s.toLowerCase()))].join('”, “')}” ×${found.length}`);
    }
  }
}
if (seen < paths.length) {
  console.log(`FAIL  only ${seen} of ${paths.length * 2} page renders answered — is the server up?`);
  process.exit(1);
}
console.log(bad === 0 ? `OK — no trial wording on ${seen} page renders` : `\n${bad} page renders promise a trial`);
process.exit(bad === 0 ? 0 : 1);
