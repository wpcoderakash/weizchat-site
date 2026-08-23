'use client';

import { useState } from 'react';

export interface WaitlistStrings {
  title: string;
  body: string;
  cta: string;
  note: string;
  success: string;
  error: string;
  subject: string;
  emailLabel: string;
  /** Template with an {email} placeholder. */
  emailBody: string;
}

/**
 * The campaigns waitlist (brief §4) — now real capture: the email POSTs
 * to /api/leads and appears in the admin's Form Leads inbox. The note
 * says the address is stored, because it is; a failed request falls back
 * to the honest prefilled mailto.
 */
export function WaitlistCta({
  email,
  locale,
  strings: s,
}: {
  email: string;
  locale: string;
  strings: WaitlistStrings;
}) {
  const [value, setValue] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'failed'>('idle');

  const mailto = `mailto:${email}?subject=${encodeURIComponent(s.subject)}&body=${encodeURIComponent(
    s.emailBody.replace('{email}', value || '—'),
  )}`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState('busy');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: 'waitlist', locale, email: value, website }),
      });
      setState(res.ok ? 'sent' : 'failed');
    } catch {
      setState('failed');
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold">{s.title}</h2>
      <p className="mt-2 text-muted">{s.body}</p>
      {state === 'sent' ? (
        <p role="status" className="mt-4 font-semibold">
          {s.success}
        </p>
      ) : (
        <>
          <form className="mt-4 flex flex-wrap items-center gap-3" onSubmit={submit}>
            <label className="sr-only" htmlFor="waitlist-email">
              {s.emailLabel}
            </label>
            <input
              id="waitlist-email"
              type="email"
              required
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={s.emailLabel}
              className="w-full max-w-xs rounded-full border border-border-strong bg-bg px-4 py-2.5 focus:border-accent"
            />
            {/* The honeypot: humans never see it, bots fill it, the API drops it. */}
            <div className="hidden" aria-hidden>
              <label htmlFor="waitlist-website">Website</label>
              <input
                id="waitlist-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={state === 'busy'}
              className="rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-60"
            >
              {s.cta}
            </button>
          </form>
          {state === 'failed' ? (
            <p role="alert" className="mt-3 text-sm font-medium text-warn">
              {s.error}{' '}
              <a href={mailto} className="underline">
                {email}
              </a>
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">{s.note}</p>
          )}
        </>
      )}
    </div>
  );
}
