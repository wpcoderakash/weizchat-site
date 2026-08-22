import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Admin authentication for the CMS.
 *
 * One shared password from `CMS_ADMIN_PASSWORD`, because this site has
 * exactly one editor — the owner. That is a deliberate limit, not an
 * oversight: a user table, invitations and roles for a single person is
 * machinery to secure and maintain for no gain. If a second editor ever
 * needs their own account, this is the module that changes.
 *
 * What it does do properly: constant-time comparison so the password
 * cannot be guessed a character at a time, an httpOnly cookie holding a
 * derived token rather than the password itself, and a hard refusal to
 * run at all when the variable is unset — an admin with no password is
 * worse than no admin.
 */
const COOKIE = 'weizchat_cms';

function secret(): string | null {
  const value = process.env.CMS_ADMIN_PASSWORD;
  return value && value.length >= 8 ? value : null;
}

/** The cookie value for a given password — never the password itself. */
function tokenFor(password: string): string {
  return createHash('sha256').update(`weizchat-cms:${password}`).digest('hex');
}

export function adminConfigured(): boolean {
  return secret() !== null;
}

export function checkPassword(attempt: string): boolean {
  const expected = secret();
  if (!expected) return false;
  const a = Buffer.from(createHash('sha256').update(attempt).digest());
  const b = Buffer.from(createHash('sha256').update(expected).digest());
  // Hashed first so both sides are the same length; timingSafeEqual then
  // compares without leaking how much of the password matched.
  return timingSafeEqual(a, b);
}

export function sessionCookie(): { name: string; value: string } {
  return { name: COOKIE, value: tokenFor(secret()!) };
}

export async function isSignedIn(): Promise<boolean> {
  const expected = secret();
  if (!expected) return false;
  const jar = await cookies();
  const got = jar.get(COOKIE)?.value;
  if (!got) return false;
  const a = Buffer.from(got, 'utf8');
  const b = Buffer.from(tokenFor(expected), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export const CMS_COOKIE = COOKIE;
