/**
 * The pricing page against the catalogue snapshot, in a real browser.
 *
 * What this protects: every number a visitor can reach — by changing the
 * billing period or the team size — is a number the app published. The page
 * owns no formula, so the check is a comparison: drive the controls, read the
 * card, look the same row up in `plan-catalogue.json`.
 *
 * Runs against a BUILT server (`PORT=4100 pnpm start`), like check-pages.
 */
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
const { chromium } = require('@playwright/test');

const BASE = process.env.BASE ?? 'http://localhost:4100';
const doc = JSON.parse(
  await readFile(new URL('../src/content/plan-catalogue.json', import.meta.url), 'utf8'),
);
const messages = {
  en: JSON.parse(await readFile(new URL('../messages/en.json', import.meta.url), 'utf8')).pricing,
  he: JSON.parse(await readFile(new URL('../messages/he.json', import.meta.url), 'utf8')).pricing,
};

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL '} ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failed += 1;
};

const money = (cents) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: doc.currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

const priced = doc.plans.filter((p) => p.pricing);
const browser = await chromium.launch();

async function open(path) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.locator('[data-plan]').first().waitFor();
  return page;
}
const priceOn = async (page, id) => {
  const el = page.locator(`[data-plan="${id}"] [data-price]`);
  return (await el.count()) ? (await el.innerText()).trim() : null;
};
/** By value, not by text: the Yearly label also carries the "Save 20%" badge. */
const setPeriod = (page, period) =>
  page.locator(`label:has(input[name="billing-period"][value="${period}"])`).click();
async function setAgents(page, n) {
  const input = page.locator('#pricing-agents');
  await input.fill(String(n));
  await input.blur();
}

// ── English ────────────────────────────────────────────────────────────────
{
  const page = await open('/pricing');
  check('four plans, in catalogue order',
    JSON.stringify(await page.locator('[data-plan]').evaluateAll((els) => els.map((e) => e.dataset.plan))) ===
      JSON.stringify(doc.plans.map((p) => p.id)));

  // Opens on MONTHLY at 3 agents: the list price, the one the landing page shows.
  for (const plan of priced) {
    const want = money(plan.quotes[2].monthly_cents);
    check(`${plan.id}: opens on the monthly list price for 3 agents (${want})`, (await priceOn(page, plan.id)) === want, String(await priceOn(page, plan.id)));
  }
  check('enterprise shows no price, and says Custom', (await priceOn(page, 'enterprise')) === null &&
    (await page.locator('[data-plan="enterprise"]').innerText()).includes(messages.en.card.custom));

  await setPeriod(page, 'yearly');
  for (const plan of priced) {
    const row = plan.quotes[2];
    check(`${plan.id}: yearly shows the published per-month figure`, (await priceOn(page, plan.id)) === money(row.yearly_per_month_cents));
    const text = await page.locator(`[data-plan="${plan.id}"]`).innerText();
    check(`${plan.id}: …with the billed total and the saving`, text.includes(money(row.yearly_total_cents)) && text.includes(money(row.yearly_savings_cents)));
  }

  // Every team size, both periods, every plan — the whole published table.
  let mismatches = 0;
  for (const period of ['monthly', 'yearly']) {
    await setPeriod(page, period);
    for (let agents = 1; agents <= Math.max(...priced.map((p) => p.pricing.max_agents)); agents += 1) {
      await setAgents(page, agents);
      for (const plan of priced) {
        const row = plan.quotes[agents - 1];
        const shown = await priceOn(page, plan.id);
        const want = row ? money(period === 'yearly' ? row.yearly_per_month_cents : row.monthly_cents) : null;
        if (shown !== want) {
          mismatches += 1;
          if (mismatches <= 3) console.log(`      ${plan.id} @${agents} ${period}: shown ${shown}, published ${want}`);
        }
      }
    }
  }
  check('every reachable price is a published one (all team sizes × both periods)', mismatches === 0, `${mismatches} mismatches`);

  await setAgents(page, 12);
  const starter = await page.locator('[data-plan="starter"]').innerText();
  check('past a plan’s largest team it shows no price and points at one that fits',
    (await priceOn(page, 'starter')) === null && starter.includes('10') && starter.includes(messages.en.tier.professional.name));

  await setAgents(page, 999);
  check('an impossible team size clamps to the largest sold', (await page.locator('#pricing-agents').inputValue()) === String(Math.max(...priced.map((p) => p.pricing.max_agents))));
  await setAgents(page, 0);
  check('…and zero clamps to one', (await page.locator('#pricing-agents').inputValue()) === '1');

  const hrefs = await page.locator('[data-plan] > a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  check('priced plans open registration; enterprise opens contact',
    hrefs.slice(0, 3).every((h) => /\/register$/.test(h)) && hrefs[3] === '/contact', JSON.stringify(hrefs));
  check('no button promises a trial', !/trial/i.test(await page.locator('main').innerText()));

  // The comparison table: open every group, then every feature must have words.
  await page.locator('[data-compare] details > summary').evaluateAll((els) => els.forEach((e) => e.click()));
  const table = await page.locator('[data-compare]').innerText();
  const missing = Object.values(doc.feature_groups).flat().filter((id) => !table.includes(messages.en.compare.features[id]?.name ?? '\u0000'));
  check('every published feature is named in the table', missing.length === 0, missing.join(', '));
  check('no translation key leaks onto the page', !/pricing\.[a-zA-Z_.]+/.test(await page.locator('body').innerText()));

  // A tooltip: reachable by keyboard, dismissible with Escape (WCAG 1.4.13).
  const tip = page.locator('[data-compare] button[aria-describedby]').first();
  await tip.focus();
  const bubble = page.locator(`[id="${await tip.getAttribute('aria-describedby')}"]`);
  check('a tooltip opens on focus', await bubble.isVisible());
  await page.keyboard.press('Escape');
  check('…and Escape dismisses it without moving focus', !(await bubble.isVisible()) && (await tip.evaluate((el) => el === document.activeElement)));
  await page.close();
}

// ── Hebrew ─────────────────────────────────────────────────────────────────
{
  const page = await open('/heb/pricing');
  check('Hebrew renders right-to-left', (await page.locator('html').getAttribute('dir')) === 'rtl');
  for (const plan of priced) {
    check(`he · ${plan.id}: same published price`, (await priceOn(page, plan.id)) === money(plan.quotes[2].monthly_cents));
  }
  check('he · prices are laid out left-to-right', (await page.locator('[data-price]').first().getAttribute('dir')) === 'ltr');
  const contact = await page.locator('[data-plan="enterprise"] > a').getAttribute('href');
  check('he · the contact button stays in Hebrew', contact === '/heb/contact', String(contact));
  check('he · no translation key leaks', !/pricing\.[a-zA-Z_.]+/.test(await page.locator('body').innerText()));
  await page.close();
}

// ── The landing preview agrees with /pricing ───────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const body = await page.locator('main').innerText();
  for (const plan of priced) {
    const want = money(plan.quotes[plan.pricing.included_agents - 1].monthly_cents);
    check(`landing · ${plan.id} shows ${want}`, body.includes(want));
  }
  check('landing · no retired plan or price', !/\$199|\bUnlimited\b.*\$|₪/.test(body));
  await page.close();
}

await browser.close();
console.log(failed === 0 ? '\npricing: all checks passed' : `\npricing: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
