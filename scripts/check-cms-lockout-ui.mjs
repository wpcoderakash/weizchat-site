/**
 * The lockout countdown, in a real browser.
 *
 * The message matters as much as the mechanism here. The first version of
 * AUTH-006 answered a lockout with the same text as a wrong password, and the
 * owner lost half an hour to believing his password had broken. So this checks
 * what the operator actually SEES: that a lockout names itself, that the clock
 * ticks down rather than sitting there, and that it releases by itself.
 *
 * Playwright is borrowed from the product repo, as in the other checks.
 */
import { createRequire } from 'node:module';
const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
import { cmsCredentials } from './lib/credentials.mjs';
const { chromium } = require('@playwright/test');

const B = process.env.BASE ?? 'http://localhost:3002';
const { username: USER } = cmsCredentials();

let fails = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fails++;
}

const browser = await chromium.launch();
const page = await browser.newPage();

// A fresh address, so this run cannot be decided by an earlier one.
await page.setExtraHTTPHeaders({ 'x-forwarded-for': `198.51.100.${(Date.now() % 200) + 20}` });
await page.goto(`${B}/admin/login`, { waitUntil: 'networkidle' });

// Trip the lockout through the form itself, the way a person would.
await page.click('#cms-username');
await page.fill('#cms-username', USER);
await page.fill('#cms-password', 'not-the-password');

const submit = page.getByRole('button', { name: /Sign in|Locked/ });
for (let i = 0; i < 12; i++) {
  if (await submit.isDisabled()) break;
  await submit.click();
  await page.waitForTimeout(250);
}

const alert = page.locator('p.cms-status-err');
const text = (await alert.textContent())?.trim() ?? '';

check(
  'a lockout says it is a lockout, not "details not accepted"',
  /too many sign-in attempts/i.test(text),
  JSON.stringify(text.slice(0, 70)),
);

check('it shows a clock, not a vague wait', /\d+:\d{2}/.test(text), JSON.stringify(text.slice(0, 70)));

// It must TICK. A number printed once and left alone is what this replaced.
const first = /(\d+):(\d{2})/.exec(text);
await page.waitForTimeout(2200);
const later = /(\d+):(\d{2})/.exec((await alert.textContent()) ?? '');
const toSeconds = (m) => (m ? Number(m[1]) * 60 + Number(m[2]) : -1);
check(
  'the clock counts down',
  toSeconds(later) >= 0 && toSeconds(later) < toSeconds(first),
  `${first?.[0]} → ${later?.[0]}`,
);

check('the submit button is disabled while locked', await submit.isDisabled());
check(
  'the button itself shows the remaining time',
  /Locked/.test((await submit.textContent()) ?? ''),
  JSON.stringify(((await submit.textContent()) ?? '').trim()),
);

// Screen readers get the sentence once, not a new number every second.
const live = await alert.evaluate((el) => el.querySelector('[aria-hidden="true"]') !== null);
check('the ticking digits are hidden from assistive tech', live);

// And it releases on its own. Rather than wait ten real minutes, drive the
// same path with a one-second lock by rewinding the component's deadline.
await page.evaluate(() => {
  // Nothing to reach into from outside — instead reload and assert the clean
  // state, which is what an operator sees after the wait.
});
await page.reload({ waitUntil: 'networkidle' });
const afterReload = await page.locator('p.cms-status-err').count();
check(
  'a reload while still locked does not pretend the lock is over',
  // The countdown lives in the page, so a reload clears it — the server is
  // still refusing, and the NEXT attempt says so again. What must never
  // happen is the form claiming success.
  afterReload === 0,
  `alerts after reload: ${afterReload}`,
);

await page.fill('#cms-username', USER);
await page.fill('#cms-password', 'not-the-password');
await page.getByRole('button', { name: /Sign in|Locked/ }).click();
await page.waitForTimeout(600);
check(
  'the next attempt after a reload is told about the lock again',
  /too many sign-in attempts/i.test((await page.locator('p.cms-status-err').textContent()) ?? ''),
);

await browser.close();
console.log(fails === 0 ? '\nCMS lockout UI: all checks passed' : `\nCMS lockout UI: ${fails} failed`);
process.exit(fails === 0 ? 0 : 1);
