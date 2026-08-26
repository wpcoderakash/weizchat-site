/**
 * Contact block guarantees (owner request, 2026-08-26).
 *
 * These are the failure modes that are invisible in a screenshot: a wa.me
 * link that WhatsApp rejects, a `tel:` that dials a label, and — the one
 * that would have cost real work — a newly required schema field silently
 * discarding an already-published document.
 *
 * Runs without a server. The TS modules are compiled to a temp directory
 * with the repo's own tsc, so there is no new dependency and no drift
 * between what is checked and what ships.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fails++;
};

// Emitted inside the repo, not the system temp dir: `zod` has to resolve,
// and Node resolves bare specifiers by walking up to node_modules.
const out = path.join(process.cwd(), 'node_modules', '.cache', 'weiz-contact-check');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
execFileSync(
  'npx',
  ['tsc', 'src/lib/contact-links.ts', 'src/cms/site-schema.ts',
   '--outDir', out, '--module', 'esnext', '--target', 'es2022',
   '--moduleResolution', 'bundler', '--skipLibCheck', '--strict', 'false'],
  { stdio: 'pipe' },
);
// Emitted .js needs to be ESM to Node; the nearest package.json decides.
fs.writeFileSync(path.join(out, 'package.json'), '{"type":"module"}');

// tsc emits bundler-style extensionless imports, which Node's ESM resolver
// will not follow. Add the extension to relative specifiers.
for (const file of fs.globSync('**/*.js', { cwd: out })) {
  const full = path.join(out, file);
  fs.writeFileSync(
    full,
    fs.readFileSync(full, 'utf8').replace(/(from\s+['"]\.[^'"]*?)(['"])/g, (m, spec, q) =>
      spec.endsWith('.js') ? m : `${spec}.js${q}`),
  );
}

const links = await import(pathToFileURL(path.join(out, 'lib/contact-links.js')).href);
const { globalDocSchema, contactBlockSchema } = await import(
  pathToFileURL(path.join(out, 'cms/site-schema.js')).href
);

// ── wa.me takes digits only ───────────────────────────────────────────────
const wa = links.whatsappHref({ label: '+972 54 474 7742', number: '+972544747742' });
check('wa.me link is built', wa.startsWith('https://wa.me/'), wa);
const waPath = wa.replace('https://wa.me/', '').split('?')[0];
check('wa.me number is digits only', /^\d+$/.test(waPath), waPath);
check('wa.me drops the plus', !wa.includes('+'), wa);

const waMsg = links.whatsappHref({ label: 'x', number: '+972544747742' }, 'Hi, I have a question');
check('opening message is url-encoded', waMsg.includes('?text=Hi%2C%20I%20have%20a%20question') || waMsg.includes('?text=Hi,%20I%20have%20a%20question'), waMsg);

// ── tel: dials the number, never the label ────────────────────────────────
const tel = links.telHref({ label: 'Call Us +380662169131', number: '+380662169131' });
check('tel: uses the machine field, not the label', tel === 'tel:+380662169131', tel);
check('tel: has no spaces', !/\s/.test(tel), tel);

// ── maps ──────────────────────────────────────────────────────────────────
const derived = links.mapHref({ id: 'a', label: 'Kiev', address: '17 Esplanadna Kyiv, Ukraine', mapUrl: '' });
check('a blank map link derives a search from the address',
  derived.startsWith('https://www.google.com/maps/search/?api=1&query=') && derived.includes('Esplanadna'), derived);
const explicit = links.mapHref({ id: 'b', label: 'X', address: 'Y', mapUrl: 'https://maps.app.goo.gl/abc' });
check('an explicit map link wins', explicit === 'https://maps.app.goo.gl/abc', explicit);

// ── E.164 is enforced, so a pretty number cannot break a link ─────────────
const spaced = contactBlockSchema.safeParse({
  phone: { label: 'x', number: '+380 66 216 9131' },
  whatsapp: { label: 'y', number: '+972544747742' },
  officesTitle: 'Offices',
});
check('a spaced number is rejected at save time', !spaced.success);

const good = contactBlockSchema.safeParse({
  phone: { label: 'x', number: '+380662169131' },
  whatsapp: { label: 'y', number: '+972544747742' },
  officesTitle: 'Offices',
  offices: [{ id: 'o1', label: 'Kiev', address: 'Somewhere' }],
});
check('a valid block parses, office mapUrl defaulting to blank',
  good.success && good.data.offices[0].mapUrl === '');

// ── the one that protects published work ──────────────────────────────────
// A document published BEFORE the contact block existed must still parse.
const legacy = {
  nav: { solutions: 'a', tools: 'a', pricing: 'a', login: 'a', startTrial: 'a', comingSoon: 'a' },
  solutionLabels: { sharedInbox: 'a', aiSalesAgent: 'a', chatbot: 'a', crm: 'a', integrations: 'a', campaigns: 'a' },
  toolLabels: { chatLink: 'a', qrCode: 'a', chatWidget: 'a', templateChecker: 'a', pricingCalculator: 'a' },
  resourceLabels: { blog: 'a', informationCenter: 'a' },
  footer: {
    tagline: 'a', solutionsTitle: 'a', toolsTitle: 'a', resourcesTitle: 'a', legalTitle: 'a',
    companyId: 'a', rights: 'a',
    legalLabels: { privacy: 'a', terms: 'a', dpa: 'a', dataDeletion: 'a', accessibility: 'a', security: 'a' },
  },
  site: {
    supportEmail: 'office@weiz.co.il', appUrl: 'https://app.weiz.chat',
    legalName: 'Weiz Chat Technologies', companyId: 'X', address: 'Y', phone: 'Z',
  },
  shared: Object.fromEntries([
    'ctaTrial','ctaDemo','comingSoon','solutionsCloser','waitlistTitle','waitlistBody','waitlistCta',
    'waitlistNote','waitlistSuccess','waitlistError','waitlistSubject','waitlistEmailLabel',
    'waitlistEmailBody','toolsKicker','toolsPrivacy','toolsCloserTitle','toolsCloserSub',
  ].map((k) => [k, 'a'])),
};
const migrated = globalDocSchema.safeParse(legacy);
check('a document published before this feature still parses', migrated.success,
  migrated.success ? '' : JSON.stringify(migrated.error.issues?.[0]));
check('…and adopts a working contact block',
  migrated.success && /^\+\d+$/.test(migrated.data.contact.whatsapp.number),
  migrated.success ? migrated.data.contact.whatsapp.number : '');
check('…keeping every existing edit',
  migrated.success && migrated.data.site.legalName === 'Weiz Chat Technologies');

// `site.address` and `site.phone` were removed once the contact block made
// them duplicates. The published document still carries them, so removal has
// to be a strip, not a parse error.
check('…and tolerates the retired address / phone / companyId fields',
  migrated.success && migrated.data.site.address === undefined
    && migrated.data.site.phone === undefined
    && migrated.data.site.companyId === undefined
    && migrated.data.footer.companyId === undefined,
  migrated.success ? JSON.stringify(Object.keys(migrated.data.site)) : '');

fs.rmSync(out, { recursive: true, force: true });
console.log(fails === 0 ? '\nCONTACT BLOCK OK' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
