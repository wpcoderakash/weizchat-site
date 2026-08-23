'use client';

import { useState } from 'react';

export interface ContactFormStrings {
  name: string;
  company: string;
  phone: string;
  message: string;
  submit: string;
  note: string;
  success: string;
  error: string;
  emailSubject: string;
  /** Template with {name} {company} {phone} {message} placeholders. */
  emailBody: string;
}

/**
 * The contact form — a real one: it POSTs to /api/leads and the message
 * lands in the admin's Form Leads inbox. The note under the button says
 * the message is stored, because it is. If the request fails, the honest
 * fallback is the old prefilled mailto link.
 */
export function ContactForm({
  email,
  locale,
  strings: t,
}: {
  email: string;
  locale: string;
  strings: ContactFormStrings;
}) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'failed'>('idle');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState('busy');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: 'contact', locale, name, company, phone, message, website }),
      });
      setState(res.ok ? 'sent' : 'failed');
    } catch {
      setState('failed');
    }
  }

  const mailtoBody = t.emailBody
    .replace('{name}', name || '—')
    .replace('{company}', company || '—')
    .replace('{phone}', phone || '—')
    .replace('{message}', message || '—');
  const mailto = `mailto:${email}?subject=${encodeURIComponent(t.emailSubject)}&body=${encodeURIComponent(mailtoBody)}`;

  const field =
    'mt-1 w-full rounded-xl border border-border-strong bg-bg px-4 py-2.5 focus:border-accent';

  if (state === 'sent') {
    return (
      <div role="status" className="rounded-card border border-border bg-surface p-6">
        <p className="font-semibold">{t.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-border bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="text-sm font-medium">
            {t.name}
          </label>
          <input
            id="c-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="c-company" className="text-sm font-medium">
            {t.company}
          </label>
          <input
            id="c-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={field}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-phone" className="text-sm font-medium">
            {t.phone}
          </label>
          <input
            id="c-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={field}
            dir="ltr"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-message" className="text-sm font-medium">
            {t.message}
          </label>
          <textarea
            id="c-message"
            rows={5}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={field}
          />
        </div>
      </div>
      {/* The honeypot: humans never see it, bots fill it, the API drops it. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="c-website">Website</label>
        <input
          id="c-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={state === 'busy'}
        className="mt-5 rounded-full bg-accent px-6 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-60"
      >
        {t.submit}
      </button>
      {state === 'failed' ? (
        <p role="alert" className="mt-3 text-sm font-medium text-warn">
          {t.error}{' '}
          <a href={mailto} className="underline">
            {email}
          </a>
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">{t.note}</p>
      )}
    </form>
  );
}
