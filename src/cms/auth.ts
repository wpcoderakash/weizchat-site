import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Admin authentication for the CMS.
 *
 * One account — `CMS_ADMIN_USERNAME` and `CMS_ADMIN_PASSWORD` — because
 * this site has exactly one editor: the owner. A deliberate limit, not an
 * oversight; a user table, invitations and roles for a single person is
 * machinery to secure and maintain for no gain. If a second editor ever
 * needs their own account, this is the module that changes.
 *
 * What it does do properly:
 *  - both fields are compared in constant time, so neither can be guessed
 *    a character at a time from response timing;
 *  - a wrong username and a wrong password are indistinguishable to the
 *    caller — otherwise the form is an oracle for which usernames exist;
 *  - the cookie holds a token derived from BOTH values, so changing
 *    either one invalidates every existing session;
 *  - it refuses to run at all when the variables are unset. An admin with
 *    no credentials is worse than no admin.
 */
const COOKIE = 'weizchat_cms';

interface Credentials {
  username: string;
  password: string;
}

function configured(): Credentials | null {
  const username = process.env.CMS_ADMIN_USERNAME;
  const password = process.env.CMS_ADMIN_PASSWORD;
  if (!username || username.length < 3) return null;
  if (!password || password.length < 8) return null;
  return { username, password };
}

/** The cookie value — derived from both fields, never either in the clear. */
function tokenFor({ username, password }: Credentials): string {
  return createHash('sha256').update(`weizchat-cms:${username}:${password}`).digest('hex');
}

/** Constant-time equality on the SHA-256 of each side. */
function sameSecret(attempt: string, expected: string): boolean {
  const a = createHash('sha256').update(attempt).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export function adminConfigured(): boolean {
  return configured() !== null;
}

export function checkCredentials(username: string, password: string): boolean {
  const expected = configured();
  if (!expected) return false;
  // Both are always compared, never short-circuited on the username: an
  // early return would make a valid username measurably slower to reject.
  const userOk = sameSecret(username.trim().toLowerCase(), expected.username.toLowerCase());
  const passOk = sameSecret(password, expected.password);
  return userOk && passOk;
}

export function sessionCookie(): { name: string; value: string } {
  return { name: COOKIE, value: tokenFor(configured()!) };
}

export async function isSignedIn(): Promise<boolean> {
  const expected = configured();
  if (!expected) return false;
  const jar = await cookies();
  const got = jar.get(COOKIE)?.value;
  if (!got) return false;
  const a = Buffer.from(got, 'utf8');
  const b = Buffer.from(tokenFor(expected), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export const CMS_COOKIE = COOKIE;
