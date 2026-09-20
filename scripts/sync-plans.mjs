#!/usr/bin/env node
/**
 * The plan catalogue snapshot — `src/content/plan-catalogue.json`.
 *
 * The pricing page is a VIEW of the app's published price list
 * (GET /api/public/plans, app ADR-0061). This site is a separate repository
 * and cannot import the app's code, so it keeps a committed snapshot of that
 * document and this script is the only thing that writes it.
 *
 *   node scripts/sync-plans.mjs            fetch, validate, write the snapshot
 *   node scripts/sync-plans.mjs --check    fetch, validate, COMPARE — exit 1 on drift
 *
 * Why a snapshot and not a fetch per visitor: the marketing site must render
 * when the app is down, and a price must not change under a visitor because a
 * deploy happened mid-read. Why a drift check: a snapshot nobody refreshes is
 * how this site went on advertising a Free plan the app had withdrawn.
 *
 * `--check` distinguishes two failures on purpose:
 *   drift        → exit 1. The page would lie. Refresh and commit the snapshot.
 *   unreachable  → exit 2. Nothing is known to be wrong; the release script
 *                  warns and carries on, because a site fix must still be
 *                  shippable while the app is briefly unreachable.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SNAPSHOT = fileURLToPath(new URL('../src/content/plan-catalogue.json', import.meta.url));
const SOURCE = process.env.PLANS_URL ?? 'https://app.weiz.chat/api/public/plans';
const CHECK = process.argv.includes('--check');

/** The shape this site can read. A newer one must fail here, not render as $NaN. */
function assertReadable(doc) {
  const fail = (why) => {
    throw new Error(`plan catalogue is not readable: ${why}`);
  };
  if (doc?.schema_version !== 1) fail(`schema_version ${doc?.schema_version}, this site reads 1`);
  if (typeof doc.currency !== 'string') fail('no currency');
  if (!Number.isInteger(doc.annual_discount_bps)) fail('no annual_discount_bps');
  if (!Array.isArray(doc.plans) || doc.plans.length === 0) fail('no plans');
  for (const plan of doc.plans) {
    if (typeof plan.id !== 'string') fail('a plan without an id');
    if (plan.pricing === null) {
      if (plan.quotes.length !== 0) fail(`${plan.id}: priced by conversation but has quotes`);
      continue;
    }
    if (plan.quotes.length !== plan.pricing.max_agents) {
      fail(`${plan.id}: ${plan.quotes.length} quotes for ${plan.pricing.max_agents} team sizes`);
    }
    for (const q of plan.quotes) {
      for (const key of ['monthly_cents', 'yearly_per_month_cents', 'yearly_total_cents']) {
        if (!Number.isInteger(q[key]) || q[key] < 0) fail(`${plan.id}: ${key} is not whole cents`);
      }
    }
  }
}

/** Stable text, so a byte comparison means a content comparison. */
const serialise = (doc) => `${JSON.stringify(doc, null, 2)}\n`;

let fetched;
try {
  const res = await fetch(SOURCE, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fetched = await res.json();
} catch (err) {
  console.error(`[plans] could not reach ${SOURCE}: ${err.message}`);
  process.exit(2);
}

assertReadable(fetched);
const next = serialise(fetched);

if (!CHECK) {
  await writeFile(SNAPSHOT, next);
  console.log(`[plans] snapshot written from ${SOURCE}`);
  console.log(`        ${fetched.plans.map((p) => p.id).join(', ')} · ${fetched.currency}`);
  process.exit(0);
}

const current = await readFile(SNAPSHOT, 'utf8').catch(() => '');
if (current === next) {
  console.log(`[plans] the snapshot matches ${SOURCE}`);
  process.exit(0);
}
console.error(`[plans] DRIFT: the committed snapshot differs from ${SOURCE}.`);
console.error('        The pricing page would show prices or limits the app does not have.');
console.error('        Run `pnpm sync:plans`, review the diff, commit, and release again.');
process.exit(1);
