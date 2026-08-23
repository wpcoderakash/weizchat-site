import { NextResponse, type NextRequest } from 'next/server';
import { addLead, leadIntakeSchema } from '../../../cms/leads';

/**
 * The public form intake. Unauthenticated by nature, so it defends
 * itself: a honeypot field (silently dropped — bots get the same 201 as
 * humans), a per-IP sliding-window rate limit, and hard length caps in
 * the schema. ADR-0008 runs one persistent host, so the in-memory window
 * is sound; a horizontal scale-out would move it to Redis.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // The map only ever holds recently active IPs.
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (limited(ip)) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 10_000) return NextResponse.json({ error: 'too_large' }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // The honeypot: a field humans never see. Filled → same success shape,
  // nothing stored.
  if (typeof body === 'object' && body !== null && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = leadIntakeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  addLead(parsed.data);
  return NextResponse.json({ ok: true }, { status: 201 });
}
