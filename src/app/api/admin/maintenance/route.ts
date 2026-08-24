import { NextResponse, type NextRequest } from 'next/server';
import { currentUser, hasRole } from '../../../../cms/auth';
import { maintenanceSchema, readMaintenance, writeMaintenance } from '../../../../cms/maintenance';

/**
 * The maintenance switch. Admin and above — taking the public site down is
 * not an editor's decision.
 *
 * There is no publish step: saving applies it. See the note in maintenance.ts.
 */
export async function GET() {
  if (!(await hasRole('admin'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ maintenance: readMaintenance() });
}

export async function PUT(req: NextRequest) {
  if (!(await hasRole('admin'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = maintenanceSchema
    .omit({ updatedAt: true, updatedBy: true })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const saved = writeMaintenance(body.data, (await currentUser())?.username);
  return NextResponse.json({ maintenance: saved });
}
