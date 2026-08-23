import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { isSignedIn } from '../../../../cms/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Preview = Next's own draft mode, behind the CMS session. Enabling it and
 * redirecting to the PUBLIC route means preview renders through exactly
 * the components and layout a visitor gets — there is no second rendering
 * path to drift. The draft cookie alone is worthless to an outsider: the
 * loaders also require a valid session before they serve a draft.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!(await isSignedIn())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const redirect = url.searchParams.get('redirect') ?? '/';
  // Same-origin paths only — this must never become an open redirect.
  const safe = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
  (await draftMode()).enable();
  return NextResponse.redirect(new URL(safe, url.origin));
}
