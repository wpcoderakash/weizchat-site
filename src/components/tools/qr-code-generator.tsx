'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { checkPhone, waLink } from '../../lib/wa';
import { CopyButton, Field, ResultBox, fieldClass } from './tool-shell';

/**
 * QR for a wa.me link. Rendered to a canvas in the browser by the `qrcode`
 * package — no image service, so the number never leaves the device.
 * Error-correction level M with a quiet zone: safe to print.
 */
export function QrCodeGenerator() {
  const t = useTranslations('tools.qrCode');
  const tc = useTranslations('tools.common');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [dataUrl, setDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const check = checkPhone(phone);
  const link = check.valid ? waLink(check.digits, message) : '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !link) {
      setDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toCanvas(canvas, link, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
      .then(() => {
        if (!cancelled) setDataUrl(canvas.toDataURL('image/png'));
      })
      .catch(() => {
        if (!cancelled) setDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-card border border-border bg-surface p-6">
        <div className="grid gap-4">
          <Field id="qr-phone" label={t('phoneLabel')} hint={t('phoneHint')}>
            <input
              id="qr-phone"
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
          <Field id="qr-msg" label={t('messageLabel')}>
            <textarea
              id="qr-msg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-semibold">{t('resultTitle')}</h2>
        <div className={link ? 'mt-4' : 'hidden'}>
          <canvas
            ref={canvasRef}
            aria-label={t('qrAlt')}
            role="img"
            className="mx-auto h-auto w-full max-w-[260px] rounded-xl border border-border bg-white p-3"
          />
          <div className="mt-3">
            <ResultBox value={link} ariaLabel={t('linkLabel')} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {dataUrl ? (
              <a
                href={dataUrl}
                download="weizchat-whatsapp-qr.png"
                className="rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover"
              >
                {t('download')}
              </a>
            ) : null}
            <CopyButton
              value={link}
              className="rounded-full border border-border-strong px-5 py-2.5 font-semibold hover:border-accent hover:text-accent"
            />
          </div>
        </div>
        {link ? null : <p className="mt-3 text-muted">{t('empty')}</p>}
      </div>
    </div>
  );
}
