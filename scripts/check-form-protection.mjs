/**
 * The public forms' bot check (owner request, 2026-09-15).
 *
 * Two properties matter and neither is visible in a screenshot.
 *
 * A token has to be the RIGHT token: siteverify reports which form the widget
 * was rendered for, and the route compares it with its own. Without that, a
 * token solved once on the waitlist would open the contact form forever.
 *
 * And a check that cannot be performed is a failed check, not a skipped one:
 * if Cloudflare is unreachable the verifier must say no rather than shrug.
 *
 * Runs without a server or a network: the verifier takes its `fetch`.
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

const out = path.join(process.cwd(), 'node_modules', '.cache', 'weiz-form-check');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
execFileSync(
  'npx',
  ['tsc', 'src/lib/turnstile.ts', '--outDir', out, '--module', 'esnext',
   '--target', 'es2022', '--moduleResolution', 'bundler', '--skipLibCheck'],
  { stdio: 'pipe' },
);
fs.writeFileSync(path.join(out, 'package.json'), '{"type":"module"}');

const { verifyTurnstileToken, TURNSTILE_ACTIONS } = await import(
  pathToFileURL(path.join(out, 'turnstile.js')).href
);

/** A siteverify that answers whatever the test wants. */
const answering = (body, ok = true) => async () => ({
  ok,
  json: async () => body,
});

check(
  'a valid token for this form is accepted',
  (await verifyTurnstileToken('s', 't', null, TURNSTILE_ACTIONS.contact,
    answering({ success: true, action: 'contact' }))) === true,
);

check(
  'a token earned on the OTHER form is refused',
  (await verifyTurnstileToken('s', 't', null, TURNSTILE_ACTIONS.contact,
    answering({ success: true, action: 'waitlist' }))) === false,
);

check(
  'a token with no action at all is refused',
  (await verifyTurnstileToken('s', 't', null, TURNSTILE_ACTIONS.contact,
    answering({ success: true }))) === false,
);

check(
  'a token Cloudflare rejects is refused',
  (await verifyTurnstileToken('s', 't', null, TURNSTILE_ACTIONS.contact,
    answering({ success: false, action: 'contact' }))) === false,
);

check(
  'an HTTP error from siteverify is refused',
  (await verifyTurnstileToken('s', 't', null, TURNSTILE_ACTIONS.contact,
    answering({ success: true, action: 'contact' }, false))) === false,
);

check(
  'an unreachable Cloudflare is refused, not skipped',
  (await verifyTurnstileToken('s', 't', null, TURNSTILE_ACTIONS.contact, async () => {
    throw new Error('network down');
  })) === false,
);

// The route's own shape: a secret means a token is demanded, and no secret
// means the form still works on the honeypot and the rate limit alone.
const route = fs.readFileSync('src/app/api/leads/route.ts', 'utf8');
check('the route asks for a token only when a secret is set', /turnstileSecret\(\)/.test(route));
check('a failed check answers 403', /bot_check_failed[\s\S]{0,120}403/.test(route));
check(
  'the honeypot still runs before the bot check',
  route.indexOf('honeypot') < route.indexOf('turnstileSecret()'),
);

console.log(fails === 0 ? '\nFORM-PROTECTION CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
