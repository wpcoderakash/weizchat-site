import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasRole, type Role } from '../../../../../../../cms/auth';
import {
  docStatus,
  draftDoc,
  publishDoc,
  resetDoc,
  saveDraft,
  unpublishDoc,
} from '../../../../../../../cms/docs';
import { globalDocSchema } from '../../../../../../../cms/site-schema';
import { globalDefault } from '../../../../../../../cms/defaults';
import { pageBySlug } from '../../../../../../../cms/registry';
import { pathsToRevalidate } from '../../../../../../../cms/load';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ kind: string; slug: string; locale: string }> };

const LOCALES = new Set(['he', 'en']);

interface Target {
  schema: z.ZodType;
  builtIn: unknown;
  /** The minimum role that may write this document. */
  writeRole: Role;
  revalidate: string[];
}

/**
 * Resolves what a request is talking about — schema, fallback, the role
 * required to write it, and which public paths a publish invalidates.
 * Global content revalidates the whole layout: the nav and footer are on
 * every page.
 */
function resolve(kind: string, slug: string, locale: string): Target | null {
  if (!LOCALES.has(locale)) return null;
  if (kind === 'page') {
    const def = pageBySlug(slug);
    if (!def) return null;
    return {
      schema: def.schema,
      builtIn: def.builtIn(locale),
      writeRole: 'editor',
      revalidate: pathsToRevalidate(def),
    };
  }
  if (kind === 'global' && slug === 'site') {
    return {
      schema: globalDocSchema,
      builtIn: globalDefault(locale),
      writeRole: 'admin',
      revalidate: ['LAYOUT'],
    };
  }
  return null;
}

function refresh(target: Target): void {
  for (const path of target.revalidate) {
    if (path === 'LAYOUT') {
      revalidatePath('/', 'layout');
    } else {
      revalidatePath(path);
    }
  }
}

export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const { kind, slug, locale } = await params;
  const target = resolve(kind, slug, locale);
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({
    doc: draftDoc(target.schema, kind as 'page', slug, locale, target.builtIn),
    status: docStatus(target.schema, kind as 'page', slug, locale),
  });
}

export async function PUT(req: Request, { params }: Params): Promise<NextResponse> {
  const { kind, slug, locale } = await params;
  const target = resolve(kind, slug, locale);
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!(await hasRole(target.writeRole))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = target.schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    );
  }
  saveDraft(target.schema, kind as 'page', slug, locale, parsed.data);
  return NextResponse.json({
    doc: parsed.data,
    status: docStatus(target.schema, kind as 'page', slug, locale),
  });
}

const actionSchema = z.object({ action: z.enum(['publish', 'unpublish']) });

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { kind, slug, locale } = await params;
  const target = resolve(kind, slug, locale);
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!(await hasRole(target.writeRole))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const body = actionSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  if (body.data.action === 'publish') {
    const published = publishDoc(target.schema, kind as 'page', slug, locale);
    if (published === null) return NextResponse.json({ error: 'nothing_to_publish' }, { status: 409 });
  } else {
    unpublishDoc(target.schema, kind as 'page', slug, locale);
  }
  // Revalidate AFTER the write, so "published" in the response means the
  // public page is actually being rebuilt with the new content.
  refresh(target);
  return NextResponse.json({ status: docStatus(target.schema, kind as 'page', slug, locale) });
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { kind, slug, locale } = await params;
  const target = resolve(kind, slug, locale);
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!(await hasRole(target.writeRole))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  resetDoc(kind as 'page', slug, locale);
  refresh(target);
  return NextResponse.json({
    doc: target.builtIn,
    status: docStatus(target.schema, kind as 'page', slug, locale),
  });
}
