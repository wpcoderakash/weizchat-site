/**
 * Cloudflare Turnstile for the public forms (matches the app's AUTH-001).
 *
 * Inert until `TURNSTILE_SECRET_KEY` is set: with no secret the widget does
 * not render and the API asks for nothing, so a deployment without the key
 * behaves exactly as it did before this existed. That is deliberate — the
 * contact form is how a stranger reaches this business, and a missing
 * environment variable must not silently close it.
 *
 * With a secret, a token is required and verified. Each token is bound to the
 * form it was solved on: siteverify echoes back the action the widget was
 * rendered for, and the route insists on its own, so a token earned on the
 * waitlist is worthless on the contact form.
 *
 * The existing honeypot and per-IP rate limit stay. This is another layer, not
 * a replacement: a bot that solves a challenge still meets both.
 */
export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Which form a token was earned on. Kept short — it travels to Cloudflare. */
export const TURNSTILE_ACTIONS = {
  contact: 'contact',
  waitlist: 'waitlist',
} as const;

export type TurnstileAction = (typeof TURNSTILE_ACTIONS)[keyof typeof TURNSTILE_ACTIONS];

export function turnstileSecret(): string | undefined {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  return secret && secret.trim() !== '' ? secret : undefined;
}

export async function verifyTurnstileToken(
  secret: string,
  token: string,
  ip: string | null,
  action: TurnstileAction,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const form = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'local') form.set('remoteip', ip);
  try {
    const res = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { success?: unknown; action?: unknown };
    // siteverify takes no expected action; it reports the one the token was
    // issued for, and the comparison is ours. A missing action fails too.
    return body.success === true && body.action === action;
  } catch {
    // Cloudflare unreachable or slow: a check that cannot be performed is a
    // failed one. The form keeps its mailto fallback, so a person who needs to
    // reach this business still can while that lasts.
    return false;
  }
}
