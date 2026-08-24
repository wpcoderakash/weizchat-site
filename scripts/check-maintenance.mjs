import { createRequire } from 'node:module';
const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
const { chromium } = require('@playwright/test');
import fs from 'node:fs';
import path from 'node:path';

const B = process.env.BASE ?? 'http://localhost:3002';
let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fails++;
};

// Credentials the same way the other checks get them.
function creds() {
  let u = process.env['CMS_ADMIN_USERNAME'];
  let p = process.env['CMS_ADMIN_PASSWORD'];
  const f = path.join(process.cwd(), '.env.local');
  if ((!u || !p) && fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = /^\s*(CMS_ADMIN_USERNAME|CMS_ADMIN_PASSWORD)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      const v = m[2].replace(/^["']|["']$/g, '');
      if (m[1].endsWith('USERNAME')) u ||= v; else p ||= v;
    }
  }
  return { u, p };
}
const { u: USER, p: PW } = creds();

const b = await chromium.launch();
const admin = await b.newContext();          // signed in
const visitor = await b.newContext();        // the public
const ap = await admin.newPage();
// The visitor is exercised through visitor.request — no page needed.

await ap.goto(`${B}/admin/login`, { waitUntil: 'networkidle' });
await ap.click('#cms-username');
await ap.fill('#cms-username', USER);
await ap.fill('#cms-password', PW);
await ap.getByRole('button', { name: 'Sign in' }).click();
await ap.waitForURL(/\/admin$/, { timeout: 20000 });

await ap.goto(`${B}/admin/maintenance`, { waitUntil: 'domcontentloaded' });
check('maintenance screen renders', (await ap.getByRole('heading', { name: 'Maintenance' }).count()) === 1);
check('site reports live before we start', (await ap.locator('.cms-badge-live').count()) === 1);

// ── turn it on ───────────────────────────────────────────────────────────────
await ap.getByRole('button', { name: /take the site down/i }).click();
await ap.waitForTimeout(1500);
check('switch reports the site is down', (await ap.locator('.cms-badge-draft').innerText()).includes('DOWN'));

const home = await visitor.request.get(`${B}/`, { maxRedirects: 0 });
check('a visitor gets 503, not 200', home.status() === 503, String(home.status()));
check('Retry-After is set', !!home.headers()['retry-after'], home.headers()['retry-after'] ?? 'missing');
const body = await home.text();
check('the notice is shown', /Back shortly|maintenance|update to the site/i.test(body));
check('the real page is NOT served', !body.includes('No WhatsApp customer left waiting'));

const heb = await visitor.request.get(`${B}/heb`, { maxRedirects: 0 });
check('Hebrew visitors get the Hebrew notice', (await heb.text()).includes('חוזרים בקרוב'));

// ── the thing that must never break ──────────────────────────────────────────
const adminDuring = await visitor.request.get(`${B}/admin/login`, { maxRedirects: 0 });
check('THE ADMIN STAYS REACHABLE while down', adminDuring.status() === 200, String(adminDuring.status()));

await ap.goto(`${B}/`, { waitUntil: 'domcontentloaded' });
check('a signed-in editor still sees the real site', (await ap.content()).includes('No WhatsApp customer left waiting'));

// ── turn it off ──────────────────────────────────────────────────────────────
await ap.goto(`${B}/admin/maintenance`, { waitUntil: 'domcontentloaded' });
await ap.getByRole('button', { name: /bring the site back online/i }).click();
await ap.waitForTimeout(1500);
const after = await visitor.request.get(`${B}/`, { maxRedirects: 0 });
check('the site is live again', after.status() === 200, String(after.status()));
check('real content is back', (await after.text()).includes('No WhatsApp customer left waiting'));

await b.close();
console.log(fails === 0 ? '\nMAINTENANCE CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
