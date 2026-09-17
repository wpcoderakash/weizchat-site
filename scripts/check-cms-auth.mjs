/**
 * CMS authentication hardening — AUTH-006, AUTH-007, AUTH-008.
 *
 * Runs against the dev server (BASE, default :3002) with the bootstrap
 * credentials from .env.local, like the other check scripts.
 *
 * Every assertion here fails against the code as it stood before round 4:
 *
 *   AUTH-006  the login endpoint took unlimited guesses
 *   AUTH-007  hashes were made at Node's default scrypt cost, N=2^14
 *   AUTH-008  the session token was derived, so it never expired and
 *             signing out did not invalidate it
 *
 * The lockout is stateful and shared with the running server, so this script
 * finishes by clearing what it tripped — see the note at the bottom.
 */
import fs from 'node:fs';
import path from 'node:path';
import { cmsCredentials } from './lib/credentials.mjs';

const B = process.env.BASE ?? 'http://localhost:3002';
const { username: USER, password: PW } = cmsCredentials();
const STORE = process.env.WEIZ_CONTENT_STORE
  ? path.resolve(process.env.WEIZ_CONTENT_STORE)
  : path.join(process.cwd(), 'content-store');

let fails = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fails++;
}

const login = (username, password, ip) =>
  fetch(`${B}/api/admin/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(ip ? { 'x-forwarded-for': ip } : {}) },
    body: JSON.stringify({ username, password }),
  });

/** A fresh address per case, so one case's lockout never decides another's. */
let seq = 0;
const nextIp = () => `203.0.113.${(seq += 1) % 250}`;

// ── AUTH-008: the session token is opaque and stored ───────────────────────
{
  const ip = nextIp();
  const res = await login(USER, PW, ip);
  check('a correct password signs in', res.status === 200, `status ${res.status}`);

  const raw = res.headers.get('set-cookie') ?? '';
  const value = /weizchat_cms=([^;]*)/.exec(raw)?.[1] ?? '';
  check(
    'the cookie carries an opaque token, not username:derivation',
    value.length === 64 && /^[0-9a-f]{64}$/.test(value) && !value.includes('%3A') && !value.includes(':'),
    `value shape ${value.slice(0, 12)}… (len ${value.length})`,
  );

  // The old scheme was a pure function of the password, so the SAME value came
  // back every time. Two sign-ins must now produce two different tokens.
  const second = await login(USER, PW, nextIp());
  const value2 = /weizchat_cms=([^;]*)/.exec(second.headers.get('set-cookie') ?? '')?.[1] ?? '';
  check('two sign-ins issue two different tokens', value !== '' && value2 !== '' && value !== value2);

  // ── signing out actually invalidates the token ──
  const me = () => fetch(`${B}/api/admin/users`, { headers: { cookie: `weizchat_cms=${value}` } });
  const before = await me();
  // `=== 200`, not `!== 401`. Asserting the absence of ONE failure code is how
  // this check first passed against a mutation that made the server answer 403
  // instead — it was blind to every refusal that was not a 401.
  check('the token is accepted while the session lives', before.status === 200, `status ${before.status}`);

  await fetch(`${B}/api/admin/session`, {
    method: 'DELETE',
    headers: { cookie: `weizchat_cms=${value}` },
  });

  const after = await me();
  check(
    'AUTH-008: the same token is refused after signing out',
    after.status === 401 || after.status === 403,
    `status ${after.status} — a copied cookie must not outlive sign-out`,
  );

  // The other session must be untouched: revocation is per session, not per user.
  const other = await fetch(`${B}/api/admin/users`, {
    headers: { cookie: `weizchat_cms=${value2}` },
  });
  check(
    'signing out one device leaves the other signed in',
    other.status === 200,
    `status ${other.status}`,
  );
}

// ── AUTH-008: a forged token is refused ────────────────────────────────────
{
  const forged = 'f'.repeat(64);
  const res = await fetch(`${B}/api/admin/users`, {
    headers: { cookie: `weizchat_cms=${forged}` },
  });
  check('a token with no row behind it is refused', res.status === 401 || res.status === 403, `status ${res.status}`);
}

// ── AUTH-006: the login endpoint locks out ─────────────────────────────────
{
  const ip = nextIp();
  const statuses = [];
  for (let i = 0; i < 8; i++) {
    statuses.push((await login(USER, 'definitely-not-the-password', ip)).status);
  }
  const locked = statuses.filter((s) => s === 429).length;
  check(
    'AUTH-006: repeated wrong passwords are locked out, not answered forever',
    locked > 0,
    `statuses ${statuses.join(',')}`,
  );

  // And the lockout is real, not cosmetic: the CORRECT password is refused too
  // while it holds. A throttle that still lets the right answer through would
  // be no throttle at all against an attacker who has just found it.
  const correct = await login(USER, PW, ip);
  check(
    'the lockout refuses even the correct password while it holds',
    correct.status === 429,
    `status ${correct.status}`,
  );

  // A different address is unaffected — the lockout must not become a denial
  // of service against the real operator.
  const elsewhere = await login(USER, PW, nextIp());
  check(
    'a different address can still sign in',
    elsewhere.status === 200,
    `status ${elsewhere.status}`,
  );
}

// ── AUTH-007: stored hashes record their cost, and it is the current one ───
{
  // The check creates its own subject rather than depending on whoever happens
  // to exist on this machine. An earlier version skipped when the users file
  // had no password-bearing row, which meant the assertion for AUTH-007 never
  // actually ran — a green that proved nothing.
  const ip = nextIp();
  const session = await login(USER, PW, ip);
  const cookie = /weizchat_cms=([^;]*)/.exec(session.headers.get('set-cookie') ?? '')?.[1] ?? '';
  const name = `authcheck-${Date.now().toString(36)}`;

  const created = await fetch(`${B}/api/admin/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: `weizchat_cms=${cookie}` },
    body: JSON.stringify({
      username: name,
      password: 'a-long-enough-test-password',
      role: 'editor',
      status: 'active',
    }),
  });
  check('a stored user can be created for the cost check', created.status < 400, `status ${created.status}`);

  const usersFile = path.join(STORE, 'users.json');
  const users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : [];
  const row = users.find((u) => u.username === name);

  check('AUTH-007: a newly written hash records the cost it was made at', row?.logN !== undefined,
    row ? `logN ${row.logN}` : 'user not found in the store');
  check('AUTH-007: that cost is 2^17, not Node\'s 2^14 default', row?.logN === 17, `logN ${row?.logN}`);

  // The hash must also be real work, not a placeholder: 64 bytes, hex.
  check('the stored hash is a full 64-byte scrypt output', typeof row?.hash === 'string' && /^[0-9a-f]{128}$/.test(row.hash),
    `hash length ${row?.hash?.length}`);

  // Round trip: the new cost must actually verify, or the upgrade would lock
  // every user out on their next sign-in — the failure mode that makes raising
  // a work factor frightening.
  const back = await login(name, 'a-long-enough-test-password', nextIp());
  check('a user hashed at the new cost can sign in', back.status === 200, `status ${back.status}`);

  await fetch(`${B}/api/admin/users?username=${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: { cookie: `weizchat_cms=${cookie}` },
  });
}

/*
 * The throttle store is shared with the running server, and this script has
 * deliberately tripped it. Left behind, it would lock the addresses used above
 * for fifteen minutes — harmless, since they are TEST-NET-3 literals nobody
 * signs in from, but the file would grow on every run.
 */
try {
  fs.rmSync(path.join(STORE, 'login-attempts.json'), { force: true });
} catch {
  /* best effort; the rows expire on their own */
}

console.log(fails === 0 ? '\nCMS auth: all checks passed' : `\nCMS auth: ${fails} failed`);
process.exit(fails === 0 ? 0 : 1);
