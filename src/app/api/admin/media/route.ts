import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { hasRole, isSignedIn } from '../../../../cms/auth';
import { MEDIA_DIR, PUBLIC_DIR } from '../../../../lib/paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The media library.
 *
 * Files land in `public/media/`, so they are served by the same static
 * pipeline as the product screenshots and need no signing or proxying.
 *
 * Three rules, because an upload endpoint is the softest part of any CMS:
 *  - authentication first, before the body is even read;
 *  - an allowlist of image types, checked against the real bytes' magic
 *    number rather than the client-supplied MIME or the extension;
 *  - a generated filename, so a caller cannot choose a path.
 */
/*
 * Uploads live in content-store/media, NOT public/: `next start` snapshots
 * the public directory at build time, so a file uploaded at runtime would
 * 404 in production — which is exactly what happened when the automated
 * check first ran. /media/<name> is served by a route handler instead.
 */

const MAX_BYTES = 8 * 1024 * 1024;

/** Magic numbers, so a .png that is really something else is refused. */
const SIGNATURES: { ext: string; test: (b: Buffer) => boolean }[] = [
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'gif', test: (b) => b.subarray(0, 6).toString('ascii').startsWith('GIF8') },
  { ext: 'webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  // SVG is text; sniffing it is unreliable and it can carry script, so it
  // is deliberately NOT accepted through upload.
];

export async function GET(): Promise<NextResponse> {
  if (!(await isSignedIn())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dirs: { dir: string; prefix: string }[] = [
    { dir: MEDIA_DIR, prefix: '/media' },
    // The product screenshots ship with the repo and are pickable too.
    { dir: path.join(PUBLIC_DIR, 'product'), prefix: '/product' },
  ];
  const files = dirs.flatMap(({ dir, prefix }) =>
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f))
          .map((f) => ({
            src: `${prefix}/${f}`,
            name: f,
            bytes: fs.statSync(path.join(dir, f)).size,
          }))
      : [],
  );
  return NextResponse.json({ files: files.sort((a, b) => a.src.localeCompare(b.src)) });
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!(await isSignedIn())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large', maxBytes: MAX_BYTES }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const match = SIGNATURES.find((s) => s.test(bytes));
  if (!match) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  }

  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  // The name is ours: a caller never influences where this lands.
  const name = `${randomUUID()}.${match.ext}`;
  fs.writeFileSync(path.join(MEDIA_DIR, name), bytes);
  return NextResponse.json({ file: { src: `/media/${name}`, name, bytes: bytes.length } }, { status: 201 });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const name = url.searchParams.get('name') ?? '';
  // Uploads only, addressed by bare filename: the shipped product
  // screenshots under /product are content the repo owns, and a path with
  // separators in it is someone probing.
  if (!/^[a-z0-9-]+\.(png|jpe?g|gif|webp)$/i.test(name)) {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  }
  const file = path.join(MEDIA_DIR, name);
  if (!fs.existsSync(file)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  fs.unlinkSync(file);
  return NextResponse.json({ ok: true });
}
