import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isSignedIn } from '../../../../../cms/auth';
import { landingPageSchema } from '../../../../../cms/schema';
import {
  builtInLandingPage,
  getLandingDraft,
  resetLandingPage,
  saveLandingPage,
} from '../../../../../cms/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ locale: string }> };

/**
 * The public page is statically generated, so a save must tell Next to
 * rebuild it. Without this the editor reports success, the store holds the
 * new content, and visitors keep seeing the prerendered old page — which
 * is exactly what happened before this line existed.
 */
function refreshPublicPage(locale: string): void {
  revalidatePath(`/${locale}`);
}

const LOCALES = new Set(['he', 'en']);

async function guard(locale: string): Promise<NextResponse | null> {
  if (!(await isSignedIn())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!LOCALES.has(locale)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return null;
}

/** The document the editor works on — draft included. */
export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const { locale } = await params;
  const denied = await guard(locale);
  if (denied) return denied;
  return NextResponse.json({ page: getLandingDraft(locale) });
}

/**
 * Saves the document. Validation happens in the store, so a payload the
 * page could not render is a 400 here rather than a broken site.
 */
export async function PUT(req: Request, { params }: Params): Promise<NextResponse> {
  const { locale } = await params;
  const denied = await guard(locale);
  if (denied) return denied;

  const parsed = landingPageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid', issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }
  const saved = saveLandingPage(locale, parsed.data);
  refreshPublicPage(locale);
  return NextResponse.json({ page: saved });
}

/** Discards the stored document and falls back to the shipped content. */
export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { locale } = await params;
  const denied = await guard(locale);
  if (denied) return denied;
  resetLandingPage(locale);
  refreshPublicPage(locale);
  return NextResponse.json({ page: builtInLandingPage(locale) });
}
