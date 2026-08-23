/**
 * Accessibility scan against a built server (`pnpm start`).
 *
 * The accessibility statement claims WCAG 2.1 level AA. This exists so
 * that claim is measured rather than asserted: axe-core runs the wcag2a,
 * wcag2aa, wcag21a and wcag21aa rule sets over a representative page from
 * every template, in both locales (so the RTL layout is scanned too).
 *
 * axe cannot prove conformance — no automated tool can — but a clean run
 * means the machine-checkable subset passes, and any violation here is a
 * real defect, not a style opinion.
 */
import { createRequire } from 'node:module';
const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
const { chromium } = require('@playwright/test');
const localRequire = createRequire(import.meta.url);
const AxeBuilder = localRequire('@axe-core/playwright').default;

const BASE = process.env.BASE ?? 'http://localhost:4100';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** One page per template, plus the two most interactive tools. */
const PATHS = [
  '/', // home: every section component
  '/ai-sales-agent', // solution template
  '/pricing',
  '/contact', // forms
  '/privacy-policy', // legal/MDX template
  '/information-center', // index template
  '/information-center/template-message-rules', // article template
  '/tools/chat-widget-generator', // inputs, select, colour picker
  '/tools/conversation-pricing-calculator', // table + many inputs
];

const browser = await chromium.launch();
let total = 0;

for (const scheme of ['light', 'dark']) {
for (const locale of ['he', 'en']) {
  for (const path of PATHS) {
    // English is unprefixed; Hebrew sits under /heb.
    const url = `${BASE}${locale === 'he' ? '/heb' : ''}${path}`;
    const ctx = await browser.newContext({ colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Dismiss the consent banner so it does not mask the page beneath it.
    await page.evaluate(() => localStorage.setItem('weizchat-consent', 'accepted'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    if (violations.length) {
      total += violations.length;
      console.log(`\n${url}  [${scheme}]`);
      for (const v of violations) {
        console.log(`  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`);
        console.log(`      ${v.nodes[0]?.target?.join(' ')}`);
      }
    }
    await ctx.close();
  }
}
}

await browser.close();
console.log(
  total === 0
    ? `\nOK — no WCAG 2.1 A/AA violations on ${PATHS.length * 4} page renders (he/en x light/dark)`
    : `\n${total} violation type(s) found`,
);
process.exit(total === 0 ? 0 : 1);
