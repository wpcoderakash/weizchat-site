'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { checkTemplate, notChecked } from '../../lib/template-rules';
import { Field, fieldClass } from './tool-shell';

/**
 * Structure checker for a WhatsApp message template. It reports what it
 * checked AND what it did not — the second list is the honest part, and
 * the reason this tool can be trusted.
 */
export function TemplateChecker() {
  const t = useTranslations('tools.templateChecker');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');

  const touched = name.trim().length > 0 || body.trim().length > 0;
  const results = touched ? checkTemplate(name, body) : [];
  const errors = results.filter((r) => r.severity === 'error');

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-card border border-border bg-surface p-6">
        <div className="grid gap-4">
          <Field id="tc-name" label={t('nameLabel')} hint={t('nameHint')}>
            <input
              id="tc-name"
              dir="ltr"
              placeholder="order_shipped_update"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field id="tc-body" label={t('bodyLabel')} hint={t('bodyHint')}>
            <textarea
              id="tc-body"
              rows={8}
              placeholder={t('bodyPlaceholder')}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-card border border-border bg-surface p-6">
          <h2 className="font-semibold">{t('resultTitle')}</h2>
          {!touched ? (
            <p className="mt-3 text-muted">{t('empty')}</p>
          ) : (
            <>
              <p
                className={`mt-3 font-medium ${errors.length === 0 ? 'text-ok' : 'text-danger'}`}
                role="status"
              >
                {errors.length === 0 ? t('allPass') : t('someFail', { count: errors.length })}
              </p>
              <ul className="mt-4 space-y-3">
                {results.map((r, i) => (
                  <li key={`${r.id}-${i}`} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-1 shrink-0 font-mono text-sm ${
                        r.severity === 'ok' ? 'text-ok' : 'text-danger'
                      }`}
                    >
                      {r.severity === 'ok' ? '✓' : '✕'}
                    </span>
                    <span>
                      <span className="font-medium">{t(`checks.${r.id}.label`)}</span>
                      <span className="block text-sm text-muted">
                        {r.severity === 'ok' ? t(`checks.${r.id}.ok`) : t(`checks.${r.id}.fail`)}
                        {r.detail ? <span dir="ltr"> — {r.detail}</span> : null}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* The honest half: everything this tool does not verify. */}
        <div className="rounded-card border border-border bg-surface-2 p-6">
          <h2 className="font-semibold">{t('notCheckedTitle')}</h2>
          <p className="mt-2 text-sm text-muted">{t('notCheckedIntro')}</p>
          <ul className="mt-3 list-disc space-y-1 ps-5 text-sm text-muted">
            {notChecked.map((key) => (
              <li key={key}>{t(`notChecked.${key}`)}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <a
              href="https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates"
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent underline hover:text-accent-hover"
            >
              {t('source')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
