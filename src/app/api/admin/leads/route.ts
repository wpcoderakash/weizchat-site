import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { hasRole } from '../../../../cms/auth';
import { deleteLead, listLeads, setLeadStatus } from '../../../../cms/leads';

/** The lead inbox's API. Editors run the inbox — leads are content work. */

export async function GET() {
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ leads: listLeads() });
}

const patchSchema = z.object({ id: z.string(), status: z.enum(['new', 'handled']) });

export async function PATCH(req: NextRequest) {
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (!setLeadStatus(body.data.id, body.data.status)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

const deleteSchema = z.object({ id: z.string() });

export async function DELETE(req: NextRequest) {
  if (!(await hasRole('editor'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (!deleteLead(body.data.id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
