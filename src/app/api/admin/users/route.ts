import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, hasRole, listUsers, removeUser, upsertUser } from '../../../../cms/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** User management. super_admin only, including for reads. */
async function guard(): Promise<NextResponse | null> {
  if (!(await hasRole('super_admin'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(): Promise<NextResponse> {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({ users: listUsers() });
}

const upsertSchema = z.object({
  username: z.string().min(3).max(120),
  password: z.string().min(8).optional(),
  role: z.enum(['editor', 'admin', 'super_admin']),
  status: z.enum(['active', 'suspended']),
});

export async function POST(req: Request): Promise<NextResponse> {
  const denied = await guard();
  if (denied) return denied;
  const body = upsertSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const result = upsertUser(body.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ users: listUsers() });
}

const deleteSchema = z.object({ username: z.string().min(1) });

export async function DELETE(req: Request): Promise<NextResponse> {
  const denied = await guard();
  if (denied) return denied;
  const body = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const me = await currentUser();
  if (me && me.username.toLowerCase() === body.data.username.toLowerCase()) {
    // Deleting yourself mid-session is only ever a mistake.
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 });
  }
  if (!removeUser(body.data.username)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ users: listUsers() });
}
