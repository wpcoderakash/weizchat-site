import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CMS_COOKIE, adminConfigured, checkCredentials, sessionCookie } from '../../../../cms/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });

/** Sign in to the CMS. Every rejection looks and times the same. */
export async function POST(req: Request): Promise<NextResponse> {
  if (!adminConfigured()) {
    return NextResponse.json({ error: 'admin_not_configured' }, { status: 503 });
  }
  const body = schema.safeParse(await req.json().catch(() => null));
  // One shape for every failure: a wrong username and a wrong password
  // must not be distinguishable, or the form tells an attacker which
  // usernames are real.
  if (!body.success || !checkCredentials(body.data.username, body.data.password)) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }
  const { name, value } = sessionCookie();
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

/** Sign out. */
export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CMS_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
