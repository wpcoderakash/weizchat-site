'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { checkPhone, waLink } from '../../lib/wa';
import { CopyButton, Field, ResultBox, fieldClass } from './tool-shell';

/**
 * Generates a real, self-contained floating WhatsApp button the visitor can
 * paste into any site. The snippet below is the actual output — it has no
 * dependencies, loads nothing from us, and tracks nobody. Inline styles are
 * deliberate: pasted into an unknown page, a class name could collide.
 */
function snippet(opts: {
  link: string;
  label: string;
  side: 'right' | 'left';
  color: string;
}): string {
  const { link, label, side, color } = opts;
  return `<!-- WhatsApp chat button — paste before </body>. No tracking, no dependencies. -->
<a href="${link}"
   target="_blank" rel="noopener noreferrer"
   aria-label="${label.replace(/"/g, '&quot;')}"
   style="position:fixed;bottom:20px;${side}:20px;z-index:9999;display:inline-flex;
          align-items:center;gap:10px;padding:12px 18px;border-radius:9999px;
          background:${color};color:#fff;font:600 15px/1 system-ui,sans-serif;
          text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.18)">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5l.9 2.1c.1.2.1.4 0 .6l-.4.5-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1l2 1c.3.1.5.2.5.4.1.1.1.7-.1 1.4Z"/>
  </svg>
  ${label}
</a>`;
}

export function ChatWidgetGenerator() {
  const t = useTranslations('tools.chatWidget');
  const tc = useTranslations('tools.common');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [label, setLabel] = useState('');
  const [side, setSide] = useState<'right' | 'left'>('right');
  const [color, setColor] = useState('#25D366');

  const check = checkPhone(phone);
  const buttonLabel = label.trim() || t('defaultLabel');
  const code = check.valid
    ? snippet({ link: waLink(check.digits, message), label: buttonLabel, side, color })
    : '';

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-card border border-border bg-surface p-6">
        <div className="grid gap-4">
          <Field id="cw-phone" label={t('phoneLabel')} hint={t('phoneHint')}>
            <input
              id="cw-phone"
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
          <Field id="cw-label" label={t('labelLabel')}>
            <input
              id="cw-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('defaultLabel')}
              className={fieldClass}
            />
          </Field>
          <Field id="cw-msg" label={t('messageLabel')}>
            <textarea
              id="cw-msg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="cw-side" label={t('sideLabel')}>
              <select
                id="cw-side"
                value={side}
                onChange={(e) => setSide(e.target.value as 'right' | 'left')}
                className={fieldClass}
              >
                <option value="right">{t('sideRight')}</option>
                <option value="left">{t('sideLeft')}</option>
              </select>
            </Field>
            <Field id="cw-color" label={t('colorLabel')}>
              <input
                id="cw-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-border-strong bg-bg px-2"
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-semibold">{t('resultTitle')}</h2>
        {code ? (
          <>
            <p className="mt-2 text-sm text-muted">{t('resultHint')}</p>
            <div className="mt-3">
              <ResultBox value={code} ariaLabel={t('resultTitle')} />
            </div>
            <div className="mt-4">
              <CopyButton value={code} />
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold">{t('previewTitle')}</h3>
              <div className="relative mt-2 h-28 rounded-xl border border-dashed border-border-strong bg-bg">
                <span
                  className={`absolute bottom-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white ${
                    side === 'right' ? 'right-4' : 'left-4'
                  }`}
                  style={{ background: color }}
                >
                  {buttonLabel}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 text-muted">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
