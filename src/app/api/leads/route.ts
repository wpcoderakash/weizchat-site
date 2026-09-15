import { NextResponse, type NextRequest } from 'next/server';
import { addLead, leadIntakeSchema } from '../../../cms/leads';
import {
  TURNSTILE_ACTIONS,
  turnstileSecret,
  verifyTurnstileToken,
  type TurnstileAction,
} from '../../../lib/turnstile';

/**
 * The public form intake. Unauthenticated by nature, so it defends
 * itself: a honeypot field (silently dropped — bots get the same 201 as
 * humans), a per-IP sliding-window rate limit, hard length caps in the
 * schema, and a Cloudflare Turnstile check. ADR-0008 runs one persistent
 * host, so the in-memory window is sound; a horizontal scale-out would move
 * it to Redis.
 *
 * The Turnstile check is the newest layer and the only optional one. With no
 * `TURNSTILE_SECRET_KEY` it is skipped entirely and the other three still
 * apply — deliberately, because this form is how a stranger reaches this
 * business and a missing environment variable must not quietly close it. The
 * deploy preflight says so out loud instead.
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

  // After the honeypot, so a bot that fills it still learns nothing, and after
  // the schema, so a token is never spent on a request that was malformed
  // anyway — tokens are single-use and the visitor would have to solve again.
  const secret = turnstileSecret();
  if (secret) {
    const token = (body as { turnstile_token?: unknown }).turnstile_token;
    const action: TurnstileAction =
      parsed.data.source === 'waitlist' ? TURNSTILE_ACTIONS.waitlist : TURNSTILE_ACTIONS.contact;
    const ok =
      typeof token === 'string' &&
      token.length > 0 &&
      (await verifyTurnstileToken(secret, token, ip, action));
    if (!ok) return NextResponse.json({ error: 'bot_check_failed' }, { status: 403 });
  }

  addLead(parsed.data);
  return NextResponse.json({ ok: true }, { status: 201 });
}
