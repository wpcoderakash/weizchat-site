import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { STORE_DIR } from '../lib/paths';

/**
 * CMS sessions, stored server-side (AUTH-008).
 *
 * ## What this replaces, and why
 *
 * The session token used to be `sha256(username : password-hash : pepper)` —
 * derived, never stored. That is elegant and it is wrong, for three reasons
 * that only show up once someone is holding a copy of the cookie:
 *
 *  1. **It never expires.** Nothing on the server knew when it was issued, so
 *     nothing could decide it was too old. The cookie carried a 12-hour
 *     `maxAge`, but `maxAge` is an instruction to a browser — an attacker
 *     replaying the value with `curl` never sees it.
 *  2. **Signing out did not sign you out.** `DELETE /api/admin/session` clears
 *     the cookie in the operator's browser. The VALUE stayed valid, because
 *     validity was a pure function of a password that had not changed.
 *  3. **There was no revocation short of a password change** — and no way at
 *     all to end one device's session while keeping another.
 *
 * A stored session fixes all three by making validity a fact about a row
 * rather than a property of a hash.
 *
 * ## Only the hash is stored
 *
 * The file holds `sha256(token)`, never the token. Reading `sessions.json`
 * therefore does not let you sign in as anybody — the same reason the product
 * stores password hashes and not passwords. The lookup is constant-time
 * against each candidate.
 *
 * ## Why a file
 *
 * The CMS's entire database is `content-store/` (see `lib/paths.ts`). Adding
 * Redis here would add an operational dependency to a marketing site that has
 * none, to hold at most a handful of rows. The file is written atomically —
 * temp file plus rename — so a crash mid-write cannot leave a truncated store
 * that locks the operator out.
 */

const SESSIONS_FILE = path.join(STORE_DIR, 'sessions.json');

/** 12 hours, matching the cookie the previous implementation set. */
const TTL_MS = 12 * 60 * 60 * 1000;

/**
 * A ceiling on rows, so a long-lived deployment cannot grow the file without
 * bound. Oldest first — a session evicted this way is one that has not been
 * used recently.
 */
const MAX_SESSIONS = 200;

interface SessionRow {
  /** sha256 of the token, hex. The token itself is never written down. */
  readonly id: string;
  readonly username: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function read(): SessionRow[] {
  if (!fs.existsSync(SESSIONS_FILE)) return [];
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    return Array.isArray(raw) ? (raw as SessionRow[]) : [];
  } catch {
    // A corrupt store signs everyone out rather than letting anyone in. The
    // operator can always sign in again; the bootstrap account is in the
    // environment and cannot be locked out by this file.
    console.error('[cms] sessions.json unreadable — every session is treated as invalid');
    return [];
  }
}

function write(rows: readonly SessionRow[]): void {
  fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
  const tmp = `${SESSIONS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(rows, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, SESSIONS_FILE);
}

/** Drops expired rows, and the oldest if the file has grown past the ceiling. */
function live(rows: readonly SessionRow[], now: number): SessionRow[] {
  const unexpired = rows.filter((r) => r.expiresAt > now);
  if (unexpired.length <= MAX_SESSIONS) return unexpired;
  return [...unexpired].sort((a, b) => b.issuedAt - a.issuedAt).slice(0, MAX_SESSIONS);
}

/**
 * Issues a session and returns the token to put in the cookie.
 *
 * 32 random bytes: the token is the whole secret now, so it carries the
 * entropy that used to come from the password hash.
 */
export function issueSession(username: string, now: number = Date.now()): string {
  const token = randomBytes(32).toString('hex');
  const rows = live(read(), now);
  rows.push({ id: hashToken(token), username, issuedAt: now, expiresAt: now + TTL_MS });
  write(rows);
  return token;
}

/**
 * The username behind a token, or null.
 *
 * Compared in constant time against each candidate. A linear scan over at most
 * `MAX_SESSIONS` rows is not worth indexing, and an index keyed by the token
 * would reintroduce the timing question this avoids.
 */
export function usernameForToken(token: string | undefined, now: number = Date.now()): string | null {
  if (!token) return null;
  const wanted = Buffer.from(hashToken(token), 'utf8');
  for (const row of read()) {
    if (row.expiresAt <= now) continue;
    const candidate = Buffer.from(row.id, 'utf8');
    if (candidate.length === wanted.length && timingSafeEqual(candidate, wanted)) {
      return row.username;
    }
  }
  return null;
}

/** Ends one session — what signing out must actually do. */
export function revokeSession(token: string | undefined, now: number = Date.now()): void {
  if (!token) return;
  const id = hashToken(token);
  const rows = live(read(), now);
  const kept = rows.filter((r) => r.id !== id);
  if (kept.length !== rows.length) write(kept);
}

/**
 * Ends every session for one user.
 *
 * Called when a password changes, when a user is suspended, and when a user is
 * deleted — the three moments where a still-valid cookie would be wrong. The
 * old derived-token scheme got the password case for free and the other two
 * not at all.
 */
export function revokeSessionsFor(username: string, now: number = Date.now()): void {
  const wanted = username.toLowerCase();
  const rows = live(read(), now);
  const kept = rows.filter((r) => r.username.toLowerCase() !== wanted);
  if (kept.length !== rows.length) write(kept);
}
