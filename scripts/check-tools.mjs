/**
 * Functional checks for the five free tools, against a built server
 * (`pnpm start`). These assert BEHAVIOUR, not markup: the wa.me URL is
 * byte-exact, the QR canvas actually paints modules, the widget snippet
 * loads nothing external, the template checker both flags and abstains,
 * and the calculator's arithmetic is right while it refuses to invent a
 * Meta rate.
 */
import { createRequire } from 'node:module';
const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
const { chromium } = require('@playwright/test');

/** Override with BASE when the built server is on another port. */
const BASE = process.env.BASE ?? 'http://localhost:4100';
const B = `${BASE}/en/tools`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
let fails = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) fails++;
};

// 1. Chat link generator
await page.goto(`${B}/chat-link-generator`, { waitUntil: 'load' });
await page.fill('#cl-phone', '0501234567');
let err = await page.locator("main [role=\"alert\"]").innerText();
check('link: rejects leading zero', /leading zero/i.test(err), err.slice(0, 40));
await page.fill('#cl-phone', '972501234567');
await page.fill('#cl-msg', 'Hi there & thanks');
const link = await page.locator('output').innerText();
check(
  'link: builds correct wa.me URL',
  link === 'https://wa.me/972501234567?text=Hi%20there%20%26%20thanks',
  link,
);

// 2. QR generator — canvas must actually paint, and download must be a real PNG
await page.goto(`${B}/qr-code-generator`, { waitUntil: 'load' });
await page.fill('#qr-phone', '972501234567');
await page.waitForTimeout(700);
const painted = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return { ok: false };
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let dark = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 128) dark++;
  return { ok: dark > 500, dark, w: c.width };
});
check('qr: canvas renders real modules', painted.ok, `dark px ${painted.dark}, w ${painted.w}`);
const href = await page.locator('a[download]').getAttribute('href');
check('qr: download is a PNG data URL', !!href && href.startsWith('data:image/png;base64,'));

// 3. Widget generator — snippet must contain the link and be valid-ish HTML
await page.goto(`${B}/chat-widget-generator`, { waitUntil: 'load' });
await page.fill('#cw-phone', '972501234567');
await page.fill('#cw-label', 'Talk to sales');
await page.selectOption('#cw-side', 'left');
const snip = await page.locator('output').innerText();
check('widget: snippet has the wa.me link', snip.includes('https://wa.me/972501234567'));
check('widget: honours left position', snip.includes('left:20px'));
check('widget: no external resources', !/src=|@import|fetch\(/.test(snip));
check('widget: has accessible label', snip.includes('aria-label="Talk to sales"'));

// 4. Template checker
await page.goto(`${B}/template-checker`, { waitUntil: 'load' });
await page.fill('#tc-name', 'Order_Update');
await page.fill('#tc-body', 'Hi {{1}}, your order {{3}} ships today.');
let body = await page.locator('main').innerText();
check('checker: flags uppercase name', /only lowercase letters/i.test(body));
check('checker: flags non-sequential vars', /must appear in order/i.test(body));
await page.fill('#tc-name', 'order_update');
await page.fill('#tc-body', 'Hi {{1}}, your order {{2}} ships today.');
body = await page.locator('main').innerText();
check('checker: passes a valid template', /No problems found/i.test(body));
check('checker: always shows what it did not check', /does NOT check/i.test(body));

// 5. Pricing calculator
await page.goto(`${B}/conversation-pricing-calculator`, { waitUntil: 'load' });
check(
  'calc: says rates are not loaded rather than inventing them',
  /not loaded/i.test(await page.locator('main').innerText()),
);
await page.fill('#pc-vol-marketing', '1000');
await page.fill('#pc-rate-marketing', '0.02');
await page.fill('#pc-vol-utility', '500');
await page.fill('#pc-rate-utility', '0.005');
await page.waitForTimeout(200);
const total = (await page.locator('tfoot').innerText()).replace(/\s+/g, ' ');
check('calc: totals 1000*0.02 + 500*0.005 = $22.50', total.includes('22.50'), total);
const disc = await page.locator('main').innerText();
check('calc: shows Meta-is-source-of-truth disclaimer', /Meta is the source of truth/i.test(disc));
check('calc: states the per-message model date', /2025-07-01/.test(disc));

await browser.close();
console.log(fails === 0 ? '\nALL TOOL CHECKS PASSED' : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
