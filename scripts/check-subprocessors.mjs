/**
 * The sub-processor list is a promise, not decoration.
 *
 * The DPA says the controller authorises "the sub-processors listed in the
 * Privacy Policy" and may object to an addition, so a provider that joins the
 * system and is forgotten in these documents is a compliance defect, not a
 * typo. ADR-0049 (app repo) decided the list; this is what keeps it.
 *
 * It reads the SHIPPED documents. The published CMS copies live on the server
 * and are pasted by hand, which is exactly why the shipped fallback must never
 * be the stale one.
 *
 * The backup vendor is deliberately absent by name — its role and country are
 * disclosed instead, and the name is given on request. That absence is checked
 * too: someone "fixing" the list by naming it would be reversing a decision,
 * not completing one.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'src/content/legal');

/** Named in every document that carries the list. */
const NAMED = ['Meta Platforms', 'Anthropic', 'Microsoft', 'Cloudflare', 'Contabo'];

/** Documents that must carry the full list, by file name. */
const DOCUMENTS = ['privacy-policy.en.mdx', 'privacy-policy.he.mdx', 'dpa.en.mdx', 'dpa.he.mdx'];

/** The transfer out of the EU, in each language. */
const TRANSFER = { en: /United States/, he: /ארצות הברית/ };

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fails++;
};

for (const file of DOCUMENTS) {
  const full = path.join(DIR, file);
  if (!fs.existsSync(full)) {
    check(`${file} exists`, false, 'missing');
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  const locale = file.includes('.he.') ? 'he' : 'en';

  const missing = NAMED.filter((name) => !text.includes(name));
  check(`${file} names every sub-processor`, missing.length === 0, missing.join(', '));

  check(`${file} discloses the transfer out of the EU`, TRANSFER[locale].test(text));

  check(`${file} does not name the backup vendor`, !/backblaze/i.test(text));

  check(`${file} has no unresolved hosting placeholder`, !/__HOSTING_[A-Z]+__/.test(text));
}

console.log(fails === 0 ? '\nSUB-PROCESSOR CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
