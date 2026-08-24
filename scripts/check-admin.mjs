/**
 * The admin tour: drives the CMS through a real browser, as an editor would.
 * Runs against the dev server (BASE, default :3002) with the bootstrap
 * credentials from .env.local. Complements check-cms.mjs (the API).
 *
 * Playwright is borrowed from the product repo — same arrangement as the
 * other check scripts; this site has no test runner of its own.
 */
import { createRequire } from 'node:module';
const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
import { cmsCredentials } from './lib/credentials.mjs';
const { chromium } = require('@playwright/test');

const B = process.env.BASE ?? 'http://localhost:3002';
const { username: USER, password: PW } = cmsCredentials();

let fails = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fails++;
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
const p = await ctx.newPage();
p.on('pageerror', (e) => { console.log('PAGEERROR:', String(e).slice(0, 140)); fails++; });

// ── sign in ──
await p.goto(`${B}/admin/login`, { waitUntil: 'networkidle' });
await p.getByLabel('Username').click(); // after hydration, or React state stays empty
await p.getByLabel('Username').fill(USER);
await p.getByLabel('Password').fill(PW);
await p.getByRole('button', { name: 'Sign in' }).click();
await p.waitForURL(/\/admin$/, { timeout: 15000 });
check('login lands on the dashboard', true);

// ── theme toggle ──
const sw = p.getByRole('switch', { name: 'Dark theme' });
check('theme toggle present, off by default', (await sw.count()) === 1 && (await sw.getAttribute('aria-checked')) === 'false');
await sw.click();
await p.waitForTimeout(300);
const darkBg = await p.evaluate(() => getComputedStyle(document.querySelector('.cms')).backgroundColor);
check('dark theme applies to the admin chrome', darkBg === 'rgb(14, 12, 20)', darkBg);
await p.reload({ waitUntil: 'networkidle' });
check('dark theme persists across reload', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
await p.getByRole('switch', { name: 'Dark theme' }).click();
check('toggle back to light', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'light');

// ── pages list + editors ──
await p.getByRole('link', { name: 'Pages' }).first().click();
await p.waitForURL(/\/admin\/pages/);
const rows = await p.locator('.cms-table tbody tr').count();
check('pages list shows all 20 pages', rows === 20, String(rows));

await p.getByRole('link', { name: 'Landing page' }).click();
await p.waitForURL(/\/admin\/pages\/home\/en/);
const sections = await p.locator('.cms-card .cms-sec-head').count();
check('landing editor renders its 12 sections', sections >= 12, String(sections));
await p.getByRole('button', { name: 'Hero', exact: true }).click();
check('landing hero fields open', (await p.locator('.cms-field input[type=text]').count()) > 0);

await p.goto(`${B}/admin/pages/pricing/en`, { waitUntil: 'domcontentloaded' });
check('generic pricing editor renders groups', (await p.locator('.cms-card').count()) >= 3);
check('pricing editor shows the price fields', (await p.getByLabel('Pro tier price').count()) === 1);

// ── save → publish → reset, watching the public page ──
const headline = p.getByLabel('Headline');
const original = await headline.inputValue();
await headline.fill('UI EDITED PRICING TITLE');
await p.getByRole('button', { name: 'Save draft' }).click();
await p.waitForTimeout(800);
const afterSave = await p.locator('.cms-status').innerText().catch(() => '');
// "Draft saved. Not live yet." — says draft, and says NOT live.
check('save draft confirms without claiming live', /draft saved/i.test(afterSave) && /not live/i.test(afterSave), afterSave);
await p.getByRole('button', { name: 'Publish' }).click();
await p.waitForTimeout(1500);
check('publish confirms', /published|live/i.test(await p.locator('.cms-status').innerText().catch(() => '')));
const pub = await (await fetch(`${B}/pricing`)).text();
check('UI publish reached the public page', pub.includes('UI EDITED PRICING TITLE'));
p.on('dialog', (d) => d.accept());
await p.getByRole('button', { name: 'Reset' }).click();
await p.waitForTimeout(1500);
const restored = await (await fetch(`${B}/pricing`)).text();
check('UI reset restored the page', restored.includes(original.slice(0, 20)));

// ── posts, media, leads, users ──
await p.goto(`${B}/admin/posts`, { waitUntil: 'domcontentloaded' });
const posts = await p.locator('.cms-table tbody tr').count();
check('posts list shows the MDX corpus', posts === 14, String(posts));
await p.goto(`${B}/admin/media`, { waitUntil: 'domcontentloaded' });
await p.locator('.cms-media button').first().waitFor({ timeout: 10000 });
check('media library renders shipped screenshots', (await p.locator('.cms-media button').count()) >= 5);
await p.goto(`${B}/admin/leads`, { waitUntil: 'domcontentloaded' });
await p.locator('.cms-card').first().waitFor({ timeout: 10000 });
check('form leads screen renders', (await p.getByRole('heading', { name: 'Form Leads' }).count()) === 1);
await p.goto(`${B}/admin/users`, { waitUntil: 'domcontentloaded' });
await p.locator('.cms-table tbody tr').first().waitFor({ timeout: 10000 });
check('users screen renders the bootstrap row', (await p.locator('.cms-table tbody tr').count()) >= 1);

// ── public site at phone width: no horizontal scroll ──
await p.setViewportSize({ width: 390, height: 800 });
await p.goto(`${B}/`, { waitUntil: 'networkidle' });
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('public home has no horizontal scroll at 390px', overflow <= 0, String(overflow));

await b.close();
console.log(fails === 0 ? '\nADMIN TOUR PASSED' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
