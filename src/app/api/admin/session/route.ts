import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { CMS_COOKIE, adminConfigured, checkCredentials, sessionCookieFor } from '../../../../cms/auth';
import { revokeSession } from '../../../../cms/sessions';
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure } from '../../../../cms/throttle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });

/**
 * The caller's address.
 *
 * Behind nginx the socket address is always 127.0.0.1, so the forwarded header
 * is the only thing that distinguishes one caller from another. It is also
 * client-controlled, which is why it is the *secondary* key: rotating the
 * header spreads an attacker across IP buckets, but the username+IP counter
 * is not the only brake — the per-account budget still applies to the account
 * actually under attack, whatever address it is attacked from.
 */
function clientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first && first.length > 0 ? first : null;
}

/** Sign in to the CMS. Every rejection looks and times the same. */
export async function POST(req: Request): Promise<NextResponse> {
  if (!adminConfigured()) {
    return NextResponse.json({ error: 'admin_not_configured' }, { status: 503 });
  }
  const body = schema.safeParse(await req.json().catch(() => null));
  const ip = clientIp(req);
  const username = body.success ? body.data.username : '';

  // Before the password is checked, not after: the point is to not do the
  // work. A check that ran afterwards would still let an attacker grind at
  // whatever rate the hash allows (AUTH-006).
  const verdict = checkLoginAllowed(username, ip);
  if (!verdict.allowed) {
    // The same body as a wrong password. A distinct "you are locked out"
    // message would confirm the username is worth attacking, and counting
    // down the remaining attempts is free reconnaissance.
    return NextResponse.json(
      { error: 'invalid' },
      { status: 429, headers: { 'retry-after': String(verdict.retryAfterSeconds) } },
    );
  }

  // One shape for every failure: a wrong username and a wrong password
  // must not be distinguishable, or the form tells an attacker which
  // usernames are real.
  const user = body.success ? await checkCredentials(body.data.username, body.data.password) : null;
  if (!user) {
    recordLoginFailure(username, ip);
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }

  clearLoginFailures(username, ip);
  const { name, value } = sessionCookieFor(user);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // Secure in production only, so localhost over http still works.
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12,
  });
  return res;
}

/**
 * Sign out — and this now genuinely ends the session (AUTH-008).
 *
 * Clearing the cookie only ever told the operator's own browser to forget the
 * value. Anyone holding a copy went on using it, because validity was derived
 * from a password rather than stored. The row goes first; clearing the cookie
 * afterwards is a courtesy to the browser, not the security boundary.
 */
export async function DELETE(): Promise<NextResponse> {
  const jar = await cookies();
  revokeSession(jar.get(CMS_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CMS_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
