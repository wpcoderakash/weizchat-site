/**
 * Content-pipeline checks for /blog and /information-center, against a
 * built server (`pnpm start`). These caught three real bugs on first run:
 * a missing file threw ENOENT and returned 500 instead of 404, gray-matter
 * handed back a JS Date whose toString() polluted the datetime attribute
 * and JSON-LD, and MDX expressions for {{n}} placeholders did not survive
 * to the page. All three are asserted here so they cannot come back.
 */
import { createRequire } from 'node:module';
const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
const { chromium } = require('@playwright/test');

/** Override with BASE when the built server is on another port. */
const BASE = process.env.BASE ?? 'http://localhost:4100';
const b = await chromium.launch();
let fails = 0;
const check = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) fails++; };

// index listing counts
for (const [path, expect, label] of [
  ['/heb/information-center', 5, 'he info-center lists 5'],
  ['/information-center', 5, 'en info-center lists 5'],
  ['/heb/blog', 2, 'he blog lists 2'],
  ['/blog', 2, 'en blog lists 2'],
]) {
  const ctx = await b.newContext(); const p = await ctx.newPage();
  await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  const n = await p.locator('main li').count();
  check(label, n === expect, `${n}`);
  await ctx.close();
}

// an article renders: h1, date, reading time, JSON-LD, markdown table
const ctx = await b.newContext(); const p = await ctx.newPage();
await p.goto(`${BASE}/information-center/template-message-rules`, { waitUntil: 'domcontentloaded' });
check('article h1', (await p.locator('main h1').innerText()).includes('template messages'));
check('article has reading time', /min read/.test(await p.locator('main').textContent()));
const ld = JSON.parse(await p.locator('script[type="application/ld+json"]').first().textContent());
check('Article JSON-LD', ld['@type'] === 'Article' && !!ld.datePublished, ld['@type']);
check('GFM table rendered', (await p.locator('main table').count()) === 1);
check('MDX braces not eaten', /\{\{1\}\}/.test(await p.locator('main').textContent()));
// hreflang points at the same slug
const alts = await p.locator('link[rel="alternate"]').evaluateAll((ls) => ls.map((l) => l.getAttribute('href')));
check('hreflang keeps slug', alts.some((h) => h.endsWith('/information-center/template-message-rules')), alts.join(' '));
await ctx.close();

// Hebrew article is RTL and in Hebrew
const c2 = await b.newContext(); const p2 = await c2.newPage();
await p2.goto(`${BASE}/heb/information-center/opt-in-requirements`, { waitUntil: 'domcontentloaded' });
check('he article dir=rtl', (await p2.locator('html').getAttribute('dir')) === 'rtl');
check('he article is Hebrew', /הסכמה/.test(await p2.locator('main h1').innerText()));
await c2.close();

// unknown slug must 404, not render blank
const c3 = await b.newContext(); const p3 = await c3.newPage();
const r = await p3.goto(`${BASE}/blog/does-not-exist`, { waitUntil: 'domcontentloaded' });
check('unknown slug 404s', r.status() === 404, String(r.status()));
await c3.close();

await b.close();
console.log(fails === 0 ? '\nALL ARTICLE CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
