'use client';

import { useState } from 'react';

export interface WaitlistStrings {
  title: string;
  body: string;
  cta: string;
  note: string;
  subject: string;
  emailLabel: string;
  /** Template with an {email} placeholder. */
  emailBody: string;
}

/**
 * The campaigns waitlist (brief §4). The marketing site has no form
 * backend, so the honest mechanism is a prefilled email — and the note
 * under the button says exactly that. Nothing typed here is stored.
 */
export function WaitlistCta({ email, strings: s }: { email: string; strings: WaitlistStrings }) {
  const [value, setValue] = useState('');

  const href = `mailto:${email}?subject=${encodeURIComponent(s.subject)}&body=${encodeURIComponent(
    s.emailBody.replace('{email}', value || '—'),
  )}`;

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold">{s.title}</h2>
      <p className="mt-2 text-muted">{s.body}</p>
      <form
        className="mt-4 flex flex-wrap items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          window.location.href = href;
        }}
      >
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
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover"
        >
          {s.cta}
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">{s.note}</p>
    </div>
  );
}
