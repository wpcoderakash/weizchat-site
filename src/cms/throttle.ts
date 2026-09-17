import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { STORE_DIR } from '../lib/paths';

/**
 * Login throttling for the CMS (AUTH-006).
 *
 * `POST /api/admin/session` is a public endpoint on `www.weiz.chat` that used
 * to accept unlimited guesses: parse, check, 401, with nothing in between. The
 * product's own sign-in has a lockout, a common-password blocklist and a bot
 * check; this plane had none of the three, and it is the plane that publishes
 * the legal documents and the marketing site.
 *
 * ## Two keys, because they stop different attacks
 *
 *  - **username + IP** stops someone grinding one account from one place.
 *  - **IP alone** stops the same attacker spraying one password across many
 *    usernames, which the first key would never notice because each username
 *    gets its own counter.
 *
 * Both must allow the attempt. The IP budget is deliberately larger, since a
 * shared office NAT can legitimately produce several people fumbling their
 * passwords at once.
 *
 * ## Lockout, not slow-down
 *
 * An artificial delay ties up a server thread per attacker and is trivially
 * defeated by opening more connections. Refusing outright costs nothing and
 * cannot be parallelised around.
 *
 * ## What this deliberately does NOT do
 *
 * It does not tell the caller how many attempts remain, and a locked-out
 * attempt returns the same `invalid` body as a wrong password with a 429
 * status. Counting down for an attacker is free reconnaissance.
 */

const ATTEMPTS_FILE = path.join(STORE_DIR, 'login-attempts.json');

/** Failures inside this window count toward a lockout. */
const WINDOW_MS = 10 * 60 * 1000;

/** How long a locked key stays locked. */
const LOCK_MS = 10 * 60 * 1000;

/**
 * Ten, not five.
 *
 * `auth.ts` says the bootstrap account exists so that "whatever happens to the
 * users file, the owner can always sign in" — and this throttle quietly took
 * that property away the day it shipped. The owner locked himself out within
 * the hour and, because the form reported a lockout as "those details were not
 * accepted", spent the time believing the password hashing had broken.
 *
 * Exempting the bootstrap account is not the answer: it is precisely the
 * account worth attacking. So the budget is loosened instead, and the numbers
 * still do the job — ten attempts per ten minutes is 1,440 a day against a
 * password scrypt already makes expensive to test. An attacker gains nothing
 * from five more tries; the operator gains room for a mistyped password and a
 * password manager filling the wrong field.
 *
 * If the owner is ever locked out with no way to wait, the recovery is to
 * empty the counter file on the server — it is a cache, not a record:
 *
 *   printf '[]\n' > "$WEIZ_CONTENT_STORE/login-attempts.json"
 */
const USER_IP_BUDGET = 10;
const IP_BUDGET = 30;

/** A ceiling on rows, so the file cannot grow without bound under a spray. */
const MAX_KEYS = 500;

interface AttemptRow {
  readonly key: string;
  failures: number;
  /** When the current window opened. */
  windowStart: number;
  /** Epoch ms; 0 when not locked. */
  lockedUntil: number;
}

/**
 * Keys are hashed, so the file never records who tried to sign in from where.
 * A failed-login log is a list of usernames and IP addresses, and this store
 * exists to refuse attempts, not to build one.
 */
function keyFor(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

function read(): AttemptRow[] {
  if (!fs.existsSync(ATTEMPTS_FILE)) return [];
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(ATTEMPTS_FILE, 'utf8'));
    return Array.isArray(raw) ? (raw as AttemptRow[]) : [];
  } catch {
    // Fail OPEN here, unlike sessions.json. A corrupt counter file must not
    // become a lockout the owner cannot clear without shell access — the
    // throttle is a brake on guessing, not an authentication decision.
    console.error('[cms] login-attempts.json unreadable — throttling is inactive until it is replaced');
    return [];
  }
}

function write(rows: readonly AttemptRow[]): void {
  fs.mkdirSync(path.dirname(ATTEMPTS_FILE), { recursive: true });
  const tmp = `${ATTEMPTS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(rows, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, ATTEMPTS_FILE);
}

/** Drops rows that are neither locked nor inside their window. */
function live(rows: readonly AttemptRow[], now: number): AttemptRow[] {
  const kept = rows.filter((r) => r.lockedUntil > now || now - r.windowStart < WINDOW_MS);
  if (kept.length <= MAX_KEYS) return kept;
  return [...kept].sort((a, b) => b.windowStart - a.windowStart).slice(0, MAX_KEYS);
}

export interface ThrottleVerdict {
  readonly allowed: boolean;
  /** Seconds the caller should wait. 0 when allowed. */
  readonly retryAfterSeconds: number;
}

function keysFor(username: string, ip: string | null): string[] {
  const user = username.trim().toLowerCase();
  const addr = ip ?? 'unknown';
  return [keyFor(['user-ip', user, addr]), keyFor(['ip', addr])];
}

function budgetFor(index: number): number {
  return index === 0 ? USER_IP_BUDGET : IP_BUDGET;
}

/** Whether this attempt may proceed. Call BEFORE checking the password. */
export function checkLoginAllowed(
  username: string,
  ip: string | null,
  now: number = Date.now(),
): ThrottleVerdict {
  const rows = read();
  let longest = 0;
  for (const key of keysFor(username, ip)) {
    const row = rows.find((r) => r.key === key);
    if (row && row.lockedUntil > now) longest = Math.max(longest, row.lockedUntil - now);
  }
  return longest > 0
    ? { allowed: false, retryAfterSeconds: Math.ceil(longest / 1000) }
    : { allowed: true, retryAfterSeconds: 0 };
}

/** Records a failure against both keys, locking either that crosses its budget. */
export function recordLoginFailure(
  username: string,
  ip: string | null,
  now: number = Date.now(),
): void {
  const rows = live(read(), now);
  keysFor(username, ip).forEach((key, index) => {
    let row = rows.find((r) => r.key === key);
    if (!row) {
      row = { key, failures: 0, windowStart: now, lockedUntil: 0 };
      rows.push(row);
    }
    // A window that has fully elapsed starts again rather than accumulating
    // across hours — otherwise an ordinary typo every few days eventually
    // locks a legitimate operator out.
    if (now - row.windowStart >= WINDOW_MS) {
      row.windowStart = now;
      row.failures = 0;
    }
    row.failures += 1;
    if (row.failures >= budgetFor(index)) row.lockedUntil = now + LOCK_MS;
  });
  write(rows);
}

/** Clears both counters after a successful sign-in. */
export function clearLoginFailures(
  username: string,
  ip: string | null,
  now: number = Date.now(),
): void {
  const rows = live(read(), now);
  const keys = new Set(keysFor(username, ip));
  const kept = rows.filter((r) => !keys.has(r.key));
  if (kept.length !== rows.length) write(kept);
}
