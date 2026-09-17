import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';
import { ENV_FILE, USERS_FILE } from '../lib/paths';
import { issueSession, revokeSessionsFor, usernameForToken } from './sessions';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * CMS authentication and roles.
 *
 * Two layers, deliberately:
 *
 *  1. The BOOTSTRAP account — `CMS_ADMIN_USERNAME` / `CMS_ADMIN_PASSWORD`
 *     from the environment. Always a super_admin, never stored, never
 *     suspendable. Its job is to make lock-out impossible: whatever
 *     happens to the users file, the owner can always sign in.
 *  2. STORED users in `content-store/users.json`, created from the admin,
 *     with scrypt-hashed passwords and one of three roles.
 *
 * Roles are a strict ladder:
 *   editor       → pages, posts, media
 *   admin        → + global content (nav, footer, site identity)
 *   super_admin  → + user management
 *
 * Sessions: an httpOnly cookie holding an opaque random token, looked up in
 * `content-store/sessions.json` (see `sessions.ts`). Every comparison is
 * constant-time, and a wrong username is indistinguishable from a wrong
 * password.
 *
 * The token used to be DERIVED — `sha256(username : password-hash : pepper)`
 * — which meant it never expired, survived signing out, and could only be
 * revoked by changing a password (AUTH-008). Validity is now a fact about a
 * stored row, so all three are ordinary operations.
 *
 * ## The cost of a password guess (AUTH-007)
 *
 * Hashing was `scryptSync(password, salt, 64)` — Node's default N=2^14, the
 * exact figure the product raised to 2^17 in AUTH-004. This plane never got
 * that change, so it was eight times cheaper to attack, on the origin with no
 * lockout. Both halves are fixed: the cost is 2^17 here too, and
 * `throttle.ts` refuses a guessing run outright.
 *
 * The cost lives in the record as `logN`, so raising it again does not
 * invalidate anyone: an absent field means a legacy 2^14 hash, verification
 * uses whatever the record says, and a successful sign-in silently rewrites
 * the hash at the current cost.
 */

export type Role = 'editor' | 'admin' | 'super_admin';

const ROLE_RANK: Record<Role, number> = { editor: 0, admin: 1, super_admin: 2 };

export interface CmsUser {
  username: string;
  role: Role;
  status: 'active' | 'suspended';
  /** hex scrypt hash + salt. Absent on the bootstrap account. */
  hash?: string;
  salt?: string;
  /**
   * The scrypt cost this hash was made at (AUTH-007). Absent means 14 — the
   * Node default every hash written before this change used. Verification
   * reads it from the record rather than assuming the current cost, which is
   * what lets the cost be raised without locking anyone out.
   */
  logN?: number;
  createdAt?: string;
}

/** OWASP's current scrypt recommendation, and what the product uses. */
const CURRENT_LOG_N = 17;
/** What every hash written before AUTH-007 used: Node's `scryptSync` default. */
const LEGACY_LOG_N = 14;
/** Node refuses parameters above `maxmem`; 128 MB is needed at N=2^17, r=8. */
const MAXMEM = 192 * 1024 * 1024;

const COOKIE = 'weizchat_cms';


function bootstrap(): { username: string; password: string } | null {
  const username = process.env.CMS_ADMIN_USERNAME;
  const password = process.env.CMS_ADMIN_PASSWORD;
  if (!username || username.length < 3 || !password || password.length < 8) return null;
  return { username, password };
}

export function adminConfigured(): boolean {
  return bootstrap() !== null;
}

function readUsers(): CmsUser[] {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    return Array.isArray(raw) ? (raw as CmsUser[]) : [];
  } catch {
    console.error('[cms] users.json unreadable — only the bootstrap account can sign in');
    return [];
  }
}

function writeUsers(users: CmsUser[]): void {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
}

async function hashPassword(
  password: string,
  saltHex?: string,
  logN: number = CURRENT_LOG_N,
): Promise<{ hash: string; salt: string; logN: number }> {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : randomBytes(16);
  const hash = await scryptAsync(password, salt, 64, {
    N: 1 << logN,
    r: 8,
    p: 1,
    maxmem: MAXMEM,
  });
  return { hash: hash.toString('hex'), salt: salt.toString('hex'), logN };
}

function same(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/*
 * `tokenFor` and `secretMaterialFor` used to live here: the derived-token
 * scheme AUTH-008 replaced. They are gone rather than deprecated, because a
 * second way to mint a session is a second thing to audit — and the whole
 * point of the change is that a session is a row, not a calculation.
 */

export async function checkCredentials(
  username: string,
  password: string,
): Promise<CmsUser | null> {
  const boot = bootstrap();
  if (!boot) return null;
  const name = username.trim().toLowerCase();

  // The bootstrap account. Both fields always compared — no short-circuit,
  // or a valid username becomes measurably faster to probe.
  const bootUserOk = same(name, boot.username.toLowerCase());
  const bootPassOk = same(password, boot.password);
  if (bootUserOk && bootPassOk) {
    return { username: boot.username, role: 'super_admin', status: 'active' };
  }

  const stored = readUsers().find((u) => u.username.toLowerCase() === name);
  // Burn comparable work whether or not the user exists — and at the SAME
  // cost, so an unknown username cannot be told from a known one by timing.
  // An absent record is verified at the current cost, which is the more
  // expensive of the two; a legacy record is cheaper, and that difference is
  // erased by the upgrade below on the first successful sign-in.
  const salt = stored?.salt ?? randomBytes(16).toString('hex');
  const logN = stored?.logN ?? (stored ? LEGACY_LOG_N : CURRENT_LOG_N);
  const attempt = (await hashPassword(password, salt, logN)).hash;
  const expected = stored?.hash ?? attempt.split('').reverse().join('');
  const passOk = same(attempt, expected);
  if (!stored || stored.status !== 'active' || !passOk) return null;

  // The hash is right but made at an old cost: rewrite it at the current one.
  // This is the only moment the plaintext is in hand, so it is the only moment
  // the upgrade is possible (AUTH-007).
  if ((stored.logN ?? LEGACY_LOG_N) !== CURRENT_LOG_N) {
    try {
      const upgraded = await hashPassword(password);
      const users = readUsers();
      const row = users.find((u) => u.username.toLowerCase() === name);
      if (row) {
        row.hash = upgraded.hash;
        row.salt = upgraded.salt;
        row.logN = upgraded.logN;
        writeUsers(users);
      }
    } catch (error) {
      // A failed upgrade must never fail the sign-in: the password was
      // correct, and the old hash is still valid. Next time will try again.
      console.error('[cms] password hash upgrade failed', error);
    }
  }
  return stored;
}

/**
 * Issues a session and returns the cookie to set.
 *
 * The value is now an opaque random token with a row behind it, not a
 * derivation of the password (AUTH-008). Everything that made the old scheme
 * convenient — no storage, no expiry bookkeeping — is exactly what made it
 * impossible to revoke.
 */
export function sessionCookieFor(user: CmsUser): { name: string; value: string } {
  return { name: COOKIE, value: issueSession(user.username) };
}

/** The signed-in user, or null. Suspension takes effect on the next request. */
/** The cookie's name, for callers that read it from a raw request. */
export const SESSION_COOKIE = COOKIE;

/**
 * Verify a session cookie value without `next/headers`.
 *
 * Middleware has no access to that API, and the maintenance gate needs the
 * same answer the pages get — one implementation, so a signed-in editor is
 * recognised identically in both places.
 */
export function userFromCookieValue(raw: string | undefined): CmsUser | null {
  if (!adminConfigured() || !raw) return null;

  // One lookup, and it answers the expiry question at the same time: a row
  // past `expiresAt` is not returned (AUTH-008).
  const username = usernameForToken(raw);
  if (!username) return null;

  const boot = bootstrap();
  if (boot && same(username.toLowerCase(), boot.username.toLowerCase())) {
    return { username: boot.username, role: 'super_admin', status: 'active' };
  }

  // A stored user must still exist and still be active. Suspending someone no
  // longer waits for their cookie to expire — `revokeSessionsFor` ends their
  // sessions at the moment of suspension — but this is the belt to that
  // brace, and it also covers a user deleted by editing the file by hand.
  const stored = readUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
  return stored && stored.status === 'active' ? stored : null;
}

export async function currentUser(): Promise<CmsUser | null> {
  const jar = await cookies();
  return userFromCookieValue(jar.get(COOKIE)?.value);
}

export async function isSignedIn(): Promise<boolean> {
  return (await currentUser()) !== null;
}

export async function hasRole(min: Role): Promise<boolean> {
  const user = await currentUser();
  return user !== null && ROLE_RANK[user.role] >= ROLE_RANK[min];
}

// ── User management (super_admin only; enforced at the API) ─────────────────

export function listUsers(): Omit<CmsUser, 'hash' | 'salt'>[] {
  const boot = bootstrap();
  const stored = readUsers().map((u) => ({ username: u.username, role: u.role, status: u.status, createdAt: u.createdAt }));
  return [
    ...(boot
      ? [{ username: boot.username, role: 'super_admin' as Role, status: 'active' as const }]
      : []),
    ...stored,
  ];
}

export async function upsertUser(input: {
  username: string;
  password?: string;
  role: Role;
  status: 'active' | 'suspended';
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.username.trim().toLowerCase();
  const boot = bootstrap();
  if (boot && name === boot.username.toLowerCase()) {
    return { ok: false, error: 'bootstrap_account' };
  }
  if (name.length < 3) return { ok: false, error: 'username_too_short' };

  const users = readUsers();
  const existing = users.find((u) => u.username.toLowerCase() === name);
  if (!existing && (!input.password || input.password.length < 8)) {
    return { ok: false, error: 'password_too_short' };
  }
  if (input.password && input.password.length < 8) {
    return { ok: false, error: 'password_too_short' };
  }

  const credentials = input.password ? await hashPassword(input.password) : null;
  if (existing) {
    // Read both BEFORE assigning, or the comparison below is against the
    // value just written and can never be true.
    const wasActive = existing.status === 'active';
    const hadRole = existing.role;

    existing.role = input.role;
    existing.status = input.status;
    if (credentials) {
      existing.hash = credentials.hash;
      existing.salt = credentials.salt;
      existing.logN = credentials.logN;
    }
    writeUsers(users);

    // Three reasons a live session must end here, and the old derived-token
    // scheme only ever handled the first: the password changed, the account
    // was suspended, or the role changed (a demoted editor must not keep an
    // admin's session). AUTH-008.
    if (credentials || (wasActive && input.status !== 'active') || hadRole !== input.role) {
      revokeSessionsFor(name);
    }
    return { ok: true };
  }

  users.push({
    username: name,
    role: input.role,
    status: input.status,
    hash: credentials!.hash,
    salt: credentials!.salt,
    logN: credentials!.logN,
    createdAt: new Date().toISOString(),
  });
  writeUsers(users);
  return { ok: true };
}

export function removeUser(username: string): boolean {
  const name = username.trim().toLowerCase();
  const boot = bootstrap();
  if (boot && name === boot.username.toLowerCase()) return false;
  const users = readUsers();
  const next = users.filter((u) => u.username.toLowerCase() !== name);
  if (next.length === users.length) return false;
  writeUsers(next);
  // A deleted user's cookie must stop working now, not in twelve hours.
  revokeSessionsFor(name);
  return true;
}

export const CMS_COOKIE = COOKIE;

/** How short a password may be. Matches what the deploy preflight enforces. */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Change the password of the signed-in account.
 *
 * Two very different storage locations behind one action:
 *
 * - A stored user keeps a scrypt hash in the users file; rewrite it.
 * - The bootstrap account's password is an environment variable, read from
 *   the production env file at boot. Changing it means rewriting that file
 *   AND updating this process's own environment, or the new password would
 *   only take effect after a restart while the old one kept working.
 *
 * The current password is always required. A session cookie is enough to act
 * as someone; it must not be enough to lock them out of their own site.
 */
export async function changeOwnPassword(
  username: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { ok: false, error: 'too_short' };
  if (newPassword === currentPassword) return { ok: false, error: 'unchanged' };
  // The env file is read by a shell (`set -a; . file`) and by PM2. A quote or
  // a newline in the value would break both, in ways that surface as a site
  // that will not start.
  if (/['\n\r]/.test(newPassword)) return { ok: false, error: 'illegal_characters' };

  const user = await checkCredentials(username, currentPassword);
  if (!user) return { ok: false, error: 'current_password_wrong' };

  const boot = bootstrap();
  const isBootstrap = boot !== null && same(user.username.toLowerCase(), boot.username.toLowerCase());

  if (!isBootstrap) {
    const users = readUsers();
    const stored = users.find((u) => u.username.toLowerCase() === user.username.toLowerCase());
    if (!stored) return { ok: false, error: 'not_found' };
    const credentials = await hashPassword(newPassword);
    stored.hash = credentials.hash;
    stored.salt = credentials.salt;
    stored.logN = credentials.logN;
    writeUsers(users);
    // A password change answers a suspected compromise, so every session for
    // this account ends — including, deliberately, the one doing the changing.
    // The caller re-issues a cookie for the browser that asked.
    revokeSessionsFor(stored.username);
    return { ok: true };
  }

  if (!ENV_FILE) return { ok: false, error: 'env_file_unknown' };
  try {
    const raw = fs.readFileSync(ENV_FILE, 'utf8');
    const line = `CMS_ADMIN_PASSWORD='${newPassword}'`;
    const next = /^CMS_ADMIN_PASSWORD=.*$/m.test(raw)
      ? raw.replace(/^CMS_ADMIN_PASSWORD=.*$/m, line)
      : `${raw.replace(/\n*$/, '')}\n${line}\n`;
    // Same permissions, written in place: this file is chmod 600 and a
    // rename from a temp file elsewhere could land it with a laxer mode.
    fs.writeFileSync(ENV_FILE, next, { mode: 0o600 });
  } catch (error) {
    console.error('[cms] could not write the environment file', error);
    return { ok: false, error: 'env_write_failed' };
  }
  // The running process keeps its own copy; without this the old password
  // would go on working until the next restart.
  process.env['CMS_ADMIN_PASSWORD'] = newPassword;
  // Explicit now, and it has to be. The old scheme peppered every token with
  // this password, so changing it invalidated every session as a side effect.
  // A stored session has no such coupling, so the revocation that used to be
  // free must be asked for (AUTH-008).
  revokeSessionsFor(user.username);
  return { ok: true };
}
