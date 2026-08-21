'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { checkPhone, waLink } from '../../lib/wa';
import { CopyButton, Field, ResultBox, fieldClass } from './tool-shell';

/** wa.me click-to-chat link builder. Pure string work in the browser. */
export function ChatLinkGenerator() {
  const t = useTranslations('tools.chatLink');
  const tc = useTranslations('tools.common');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const check = checkPhone(phone);
  const link = check.valid ? waLink(check.digits, message) : '';

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-card border border-border bg-surface p-6">
        <div className="grid gap-4">
          <Field id="cl-phone" label={t('phoneLabel')} hint={t('phoneHint')}>
            <input
              id="cl-phone"
              inputMode="tel"
              dir="ltr"
              placeholder="972501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
              aria-invalid={phone.length > 0 && !check.valid}
            />
          </Field>
          {phone.length > 0 && !check.valid && check.reason ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {tc(`phoneError.${check.reason}`)}
            </p>
          ) : null}
          <Field id="cl-msg" label={t('messageLabel')} hint={t('messageHint')}>
            <textarea
              id="cl-msg"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-semibold">{t('resultTitle')}</h2>
        {link ? (
          <>
            <div className="mt-3">
              <ResultBox value={link} ariaLabel={t('resultTitle')} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <CopyButton value={link} />
              <a
                href={link}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-border-strong px-5 py-2.5 font-semibold hover:border-accent hover:text-accent"
              >
                {t('test')}
              </a>
            </div>
          </>
        ) : (
          <p className="mt-3 text-muted">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
