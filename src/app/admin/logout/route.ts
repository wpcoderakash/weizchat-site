import { NextResponse } from 'next/server';
import { CMS_COOKIE } from '../../../cms/auth';

export const dynamic = 'force-dynamic';

/** Signs out and lands on the login page. */
export async function GET(req: Request): Promise<NextResponse> {
  const res = NextResponse.redirect(new URL('/admin/login', new URL(req.url).origin));
  res.cookies.set(CMS_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
