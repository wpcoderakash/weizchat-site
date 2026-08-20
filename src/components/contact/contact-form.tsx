'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { site } from '../../config/site';

/**
 * The contact form. This site has no backend, so the form composes a
 * message and opens the visitor's email client — and the note under the
 * button says exactly that. A form that silently discarded submissions
 * would be the worst kind of fake functionality.
 */
export function ContactForm() {
  const t = useTranslations('contact.form');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = t('emailBody', {
      name: name || '—',
      company: company || '—',
      phone: phone || '—',
      message: message || '—',
    });
    window.location.href = `mailto:${site.supportEmail}?subject=${encodeURIComponent(
      t('emailSubject'),
    )}&body=${encodeURIComponent(body)}`;
  }

  const field =
    'mt-1 w-full rounded-xl border border-border-strong bg-bg px-4 py-2.5 focus:border-accent';

  return (
    <form onSubmit={submit} className="rounded-card border border-border bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="text-sm font-medium">
            {t('name')}
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
            {t('company')}
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
            {t('phone')}
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
            {t('message')}
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
      <button
        type="submit"
        className="mt-5 rounded-full bg-accent px-6 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover"
      >
        {t('submit')}
      </button>
      <p className="mt-3 text-sm text-muted">{t('note')}</p>
    </form>
  );
}
