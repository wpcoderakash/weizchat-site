import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, hasRole } from '../../../../cms/auth';
import { postDocSchema } from '../../../../cms/site-schema';
import { adminListPosts, postsAdmin, type Collection } from '../../../../cms/posts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Blog and information-center management. Editors and up.
 *
 * One route rather than one per verb: a post is addressed by
 * (collection, slug, locale) in the body, and the action decides what
 * happens. Publishing revalidates the collection index and the article's
 * own path in the right locale prefix — "published" in the response means
 * the public page is actually rebuilding.
 */
const KEY = z.object({
  collection: z.enum(['blog', 'information-center']),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and hyphens'),
  locale: z.enum(['en', 'he']),
});

function refresh(collection: Collection, slug: string, locale: string): void {
  // Hebrew twice: the internal /he path and the public /heb alias.
  const prefixes = locale === 'he' ? ['/he', '/heb'] : ['/en'];
  for (const prefix of prefixes) {
    revalidatePath(`${prefix}/${collection}`);
    revalidatePath(`${prefix}/${collection}/${slug}`);
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const key = KEY.safeParse({
    collection: url.searchParams.get('collection'),
    slug: url.searchParams.get('slug'),
    locale: url.searchParams.get('locale'),
  });
  if (key.success) {
    const doc = postsAdmin.read(key.data.collection, key.data.slug, key.data.locale);
    if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({
      doc,
      status: postsAdmin.status(key.data.collection, key.data.slug, key.data.locale),
    });
  }
  return NextResponse.json({ posts: adminListPosts() });
}

const writeSchema = z.object({ key: KEY, doc: postDocSchema });

export async function PUT(req: Request): Promise<NextResponse> {
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = writeSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      {
        error: 'invalid',
        issues: body.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    );
  }
  const { collection, slug, locale } = body.data.key;
  postsAdmin.save(collection, slug, locale, body.data.doc, (await currentUser())?.username);
  return NextResponse.json({ status: postsAdmin.status(collection, slug, locale) });
}

const actionSchema = z.object({ key: KEY, action: z.enum(['publish', 'unpublish']) });

export async function POST(req: Request): Promise<NextResponse> {
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = actionSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { collection, slug, locale } = body.data.key;
  const user = await currentUser();
  if (body.data.action === 'publish') {
    if (postsAdmin.publish(collection, slug, locale, user?.username) === null) {
      return NextResponse.json({ error: 'nothing_to_publish' }, { status: 409 });
    }
  } else {
    postsAdmin.unpublish(collection, slug, locale, user?.username);
  }
  refresh(collection, slug, locale);
  return NextResponse.json({ status: postsAdmin.status(collection, slug, locale) });
}

const deleteSchema = z.object({ key: KEY });

export async function DELETE(req: Request): Promise<NextResponse> {
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { collection, slug, locale } = body.data.key;
  postsAdmin.reset(collection, slug, locale);
  refresh(collection, slug, locale);
  return NextResponse.json({ ok: true });
}
