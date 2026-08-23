import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Leaves preview: back to seeing what a visitor sees. */
export async function GET(req: Request): Promise<NextResponse> {
  (await draftMode()).disable();
  const url = new URL(req.url);
  const redirect = url.searchParams.get('redirect') ?? '/';
  const safe = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
  return NextResponse.redirect(new URL(safe, url.origin));
}
