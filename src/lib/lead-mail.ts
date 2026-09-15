import { site } from '../config/site';
import type { Lead } from '../cms/leads';

/**
 * The email that tells this business a stranger wrote to it.
 *
 * The contact form has always stored the lead as a durable file for
 * /admin/leads (ADR-0032). Nothing ever announced it, so a message sat there
 * until somebody thought to look — which is not how anyone runs a contact
 * form. This sends the notification.
 *
 * ## Why Microsoft Graph and not the local mail server
 *
 * `weiz.chat` publishes no SPF, DKIM or DMARC, so anything this host posts
 * directly would arrive at a Microsoft 365 inbox as junk, or not at all. A
 * notification that silently lands in spam is worse than none: it looks like
 * it works. So this uses the same transport the app already sends its sign-in
 * codes through — Microsoft 365, app-only, `Mail.Send` (ADR-0045 in the app
 * repo) — from an address in a domain that is actually authorised to send.
 *
 * ## Inert until configured, exactly like the bot check
 *
 * With no configuration this does nothing and says so once in the log. The
 * lead is already on disk before this is called and the visitor's submission
 * never depends on it — this form is how a stranger reaches this business,
 * and neither a missing environment variable nor a bad afternoon at Microsoft
 * may be allowed to turn it into an error page.
 */
const LOGIN = 'https://login.microsoftonline.com';
const GRAPH = 'https://graph.microsoft.com/v1.0';
const TIMEOUT_MS = 10_000;
const TOKEN_MARGIN_MS = 60_000;

export interface LeadMailConfig {
  readonly tenantId: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly from: string;
  readonly to: string;
}

const env = (name: string): string => (process.env[name] ?? '').trim();

/**
 * The configuration, or null when it is incomplete.
 *
 * All five or nothing: a half-filled environment file would otherwise fail on
 * every submission, at Microsoft, one lead at a time.
 */
export function leadMailConfig(): LeadMailConfig | null {
  const config = {
    tenantId: env('LEADS_MS_TENANT_ID'),
    clientId: env('LEADS_MS_CLIENT_ID'),
    clientSecret: env('LEADS_MS_CLIENT_SECRET'),
    from: env('LEADS_MAIL_FROM'),
    to: env('LEADS_NOTIFY_TO'),
  };
  return Object.values(config).every((v) => v !== '') ? config : null;
}

/** Deliberately loose — this decides whether a Reply-To is worth setting. */
const looksLikeEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** No control characters reach a subject line, whatever a visitor typed. */
const oneLine = (value: string, max = 78): string =>
  value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);

export function renderLeadEmail(lead: Lead): { subject: string; text: string } {
  const who = oneLine(lead.name) || oneLine(lead.email) || 'someone';
  const subject =
    lead.source === 'waitlist'
      ? `New waitlist signup — ${who}`
      : `New contact form message — ${who}`;

  // Plain text, and sent as plain text: a visitor's words are data, never
  // markup, on the way out as much as on the way in.
  const lines = [
    lead.source === 'waitlist' ? 'Someone joined the waitlist.' : 'Someone used the contact form.',
    '',
    `Name:     ${lead.name || '—'}`,
    `Company:  ${lead.company || '—'}`,
    `Email:    ${lead.email || '—'}`,
    `Phone:    ${lead.phone || '—'}`,
    `Language: ${lead.locale === 'he' ? 'Hebrew' : 'English'}`,
    `Received: ${lead.createdAt}`,
  ];
  if (lead.message) lines.push('', 'Message:', lead.message);
  lines.push(
    '',
    '—',
    `Open it in the admin: ${site.url}/admin/leads`,
    lead.email && looksLikeEmail(lead.email)
      ? 'Reply to this email and it goes straight to them.'
      : 'They left no email address — the phone number above is the only way back.',
  );

  return { subject, text: lines.join('\n') };
}

export type LeadMailFailure = 'auth_failed' | 'permission_denied' | 'rejected' | 'unreachable';

export class LeadMailError extends Error {
  readonly reason: LeadMailFailure;
  constructor(reason: LeadMailFailure, detail?: string) {
    super(detail ? `${reason}: ${detail}` : reason);
    this.name = 'LeadMailError';
    this.reason = reason;
  }
}

let cached: { token: string; expiresAt: number; clientId: string } | null = null;

async function token(config: LeadMailConfig, fetchImpl: typeof fetch): Promise<string> {
  // Keyed on the client id as well as the clock, so changing the credential
  // in the environment file and restarting cannot reuse the old tenant's token.
  if (cached && cached.clientId === config.clientId && cached.expiresAt > Date.now()) {
    return cached.token;
  }
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  let res: Response;
  try {
    res = await fetchImpl(`${LOGIN}/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new LeadMailError('unreachable', 'login.microsoftonline.com');
  }

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: unknown;
    expires_in?: unknown;
    error?: unknown;
  };
  if (!res.ok || typeof json.access_token !== 'string') {
    // `invalid_client` covers a wrong id, a wrong or expired secret and a
    // wrong tenant. Microsoft does not say which, and neither do we — the
    // secret must not be narrowed down by our error messages.
    const code = typeof json.error === 'string' ? json.error : `HTTP ${res.status}`;
    throw new LeadMailError('auth_failed', code);
  }
  const ttl = typeof json.expires_in === 'number' ? json.expires_in * 1000 : 3_000_000;
  cached = {
    token: json.access_token,
    expiresAt: Date.now() + ttl - TOKEN_MARGIN_MS,
    clientId: config.clientId,
  };
  return json.access_token;
}

export async function sendLeadNotification(
  config: LeadMailConfig,
  lead: Lead,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const access = await token(config, fetchImpl);
  const { subject, text } = renderLeadEmail(lead);

  const message = {
    subject,
    body: { contentType: 'Text', content: text },
    toRecipients: [{ emailAddress: { address: config.to } }],
    // The point of the whole thing: Reply goes to the person who wrote in,
    // not to the mailbox that sent the notification.
    ...(lead.email && looksLikeEmail(lead.email)
      ? { replyTo: [{ emailAddress: { address: lead.email } }] }
      : {}),
  };

  let res: Response;
  try {
    res = await fetchImpl(`${GRAPH}/users/${encodeURIComponent(config.from)}/sendMail`, {
      method: 'POST',
      headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
      body: JSON.stringify({ message, saveToSentItems: false }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new LeadMailError('unreachable', 'graph.microsoft.com');
  }
  if (res.status === 202) return;

  const json = (await res.json().catch(() => ({}))) as { error?: { code?: unknown } };
  const code = typeof json.error?.code === 'string' ? json.error.code.slice(0, 80) : undefined;
  if (res.status === 401) throw new LeadMailError('auth_failed', code);
  // The signature of an app registration whose Mail.Send consent was never
  // granted — which is a click in Azure, not a bad credential.
  if (res.status === 403) throw new LeadMailError('permission_denied', code ?? 'Mail.Send');
  throw new LeadMailError('rejected', code ?? `HTTP ${res.status}`);
}

/**
 * Sends the notification and swallows every failure into one log line.
 *
 * The lead is already on disk. Nothing a mail server does may reach the
 * visitor, who has done nothing wrong and cannot fix it.
 */
export async function notifyNewLead(lead: Lead): Promise<void> {
  const config = leadMailConfig();
  if (!config) {
    console.warn(
      `[leads] ${lead.id} stored, no email sent: lead notification is not configured ` +
        '(LEADS_NOTIFY_TO, LEADS_MAIL_FROM, LEADS_MS_TENANT_ID, LEADS_MS_CLIENT_ID, ' +
        'LEADS_MS_CLIENT_SECRET).',
    );
    return;
  }
  try {
    await sendLeadNotification(config, lead);
    console.log(`[leads] ${lead.id} stored and notified.`);
  } catch (err) {
    const reason = err instanceof LeadMailError ? err.message : 'unknown';
    console.error(`[leads] ${lead.id} stored, but the notification failed — ${reason}`);
  }
}
