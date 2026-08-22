/**
 * Whole-site page check. Run against a built server (`pnpm start`).
 *
 * It exists because a missing translation key does not crash next-intl —
 * it renders the key path as visible text, which shipped `pricing.tier.
 * pro.name` to a real page once. So the assertions here are the ones a
 * human reviewer would make by eye, on every page, in both locales:
 *
 *  1. the page renders (200) and has exactly one <h1>;
 *  2. no raw message key leaked into visible text;
 *  3. the only __PLACEHOLDER__ tokens present are ones we deliberately
 *     ship until the owner supplies the real value;
 *  4. no Meta partner/badge claim appears anywhere (brief rule 0.2).
 */
const BASE = process.env.BASE ?? 'http://localhost:4100';

const PATHS = [
  '/',
  '/shared-inbox',
  '/ai-sales-agent',
  '/chatbot',
  '/crm',
  '/integrations',
  '/campaigns',
  '/pricing',
  '/contact',
  '/privacy-policy',
  '/terms',
  '/dpa',
  '/accessibility',
  '/data-deletion',
  '/security',
  '/tools/chat-link-generator',
  '/tools/qr-code-generator',
  '/tools/chat-widget-generator',
  '/tools/template-checker',
  '/tools/conversation-pricing-calculator',
  '/blog',
  '/information-center',
  // One article from each collection — the rest are covered by the same code path.
  '/information-center/what-is-the-whatsapp-business-platform',
  '/information-center/conversation-pricing-explained',
  '/blog/what-an-ai-agent-must-never-do',
];

/** Deliberate, owner-supplied-later tokens. Anything else is a bug. */
const ALLOWED_PLACEHOLDERS = new Set([
  '__LEGAL_NAME__',
  '__COMPANY_ID__',
  '__ADDRESS__',
  '__PHONE__',
  '__TIER_FREE_PRICE__',
  '__TIER_PRO_PRICE__',
  '__TIER_UNLIMITED_PRICE__',
  '__HOSTING_PROVIDER__',
  '__HOSTING_REGION__',
  '__PAYMENT_TERMS__',
  '__LIABILITY_CAP__',
  '__VENUE_CITY__',
  '__ACCESSIBILITY_COORDINATOR_NAME__',
]);

const NAMESPACES = [
  'nav',
  'footer',
  'solutions',
  'pricing',
  'contact',
  'legal',
  'cookies',
  'tools',
  'articles',
];
const RAW_KEY = new RegExp(`\\b(?:${NAMESPACES.join('|')})(?:\\.[a-zA-Z0-9_]+){1,4}\\b`, 'g');

const BADGE_CLAIMS =
  /(meta business partner|official meta partner|verified by meta|meta tech provider|שותף עסקי של meta|ספק טכנולוגיה מאושר)/i;

const { chromium } = await import(
  '/Users/akashbiswas/Desktop/whatsapp sass Project/node_modules/@playwright/test/index.mjs'
).catch(async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
  return require('@playwright/test');
});

const browser = await chromium.launch();
let failures = 0;

for (const locale of ['he', 'en']) {
  for (const path of PATHS) {
    const url = `${BASE}${locale === 'he' ? '' : '/en'}${path}`;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const problems = [];

    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (response?.status() !== 200) problems.push(`status ${response?.status()}`);

    const h1s = await page.locator('main h1').count();
    if (h1s !== 1) problems.push(`${h1s} h1 elements`);

    const text = await page.locator('body').innerText();

    const rawKeys = [...new Set(text.match(RAW_KEY) ?? [])];
    if (rawKeys.length) problems.push(`raw message keys: ${rawKeys.join(', ')}`);

    const unexpected = [...new Set(text.match(/__[A-Z_]+__/g) ?? [])].filter(
      (token) => !ALLOWED_PLACEHOLDERS.has(token),
    );
    if (unexpected.length) problems.push(`unexpected placeholders: ${unexpected.join(', ')}`);

    const badge = text.match(BADGE_CLAIMS);
    if (badge) problems.push(`partner claim: "${badge[0]}"`);

    if (problems.length) {
      failures += 1;
      console.log(`FAIL ${url}\n      ${problems.join('\n      ')}`);
    }
    await ctx.close();
  }
}

await browser.close();
console.log(
  failures === 0
    ? `OK — ${PATHS.length * 2} pages clean`
    : `${failures} page(s) with problems`,
);
process.exit(failures === 0 ? 0 : 1);
