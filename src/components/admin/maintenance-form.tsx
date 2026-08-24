'use client';

import { useState } from 'react';
import type { Maintenance } from '../../cms/maintenance';

/**
 * Maintenance mode.
 *
 * No draft/publish here, unlike every other screen: you reach for this when
 * the site needs to be down now. Saving applies it, and the button says so.
 */
export function MaintenanceForm({ initial }: { initial: Maintenance }) {
  const [state, setState] = useState<Maintenance>(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function edit(patch: Partial<Maintenance>) {
    setState((s) => ({ ...s, ...patch }));
  }

  async function save(enabled: boolean) {
    setBusy(true);
    setNote(null);
    const next = { ...state, enabled };
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: next.enabled,
          retryAfterMinutes: next.retryAfterMinutes,
          en: next.en,
          he: next.he,
        }),
      });
      if (!res.ok) {
        setNote({ kind: 'err', text: 'That could not be saved.' });
        return;
      }
      const data = (await res.json()) as { maintenance: Maintenance };
      setState(data.maintenance);
      setNote({
        kind: 'ok',
        text: enabled
          ? 'Maintenance mode is ON. Visitors now see the notice; you still see the site.'
          : 'Maintenance mode is OFF. The site is live again.',
      });
    } catch {
      setNote({ kind: 'err', text: 'The server could not be reached.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="cms-bar">
        <h1>Maintenance</h1>
        <span className={state.enabled ? 'cms-badge-draft' : 'cms-badge-live'}>
          {state.enabled ? 'Site is DOWN for visitors' : 'Site is live'}
        </span>
        <div className="cms-spacer" />
        {note ? (
          <span className={note.kind === 'ok' ? 'cms-status cms-status-ok' : 'cms-status cms-status-err'} role="status">
            {note.text}
          </span>
        ) : null}
      </div>

      <div className="cms-wrap cms-wrap-narrow">
        <div className="cms-card">
          <div className="cms-sec-head">
            <span style={{ fontWeight: 600 }}>The switch</span>
          </div>
          <div className="cms-body">
            <p className="cms-note">
              With maintenance on, every public page answers with the notice below and the status
              code 503, so search engines treat it as temporary rather than recording the notice as
              your content. <strong>You are not locked out:</strong> the admin stays reachable, and
              while you are signed in you still see the real site — so you can check your changes
              before turning it back off.
            </p>
            <div>
              {state.enabled ? (
                <button type="button" className="cms-btn cms-btn-primary" disabled={busy} onClick={() => save(false)}>
                  {busy ? 'Working…' : 'Bring the site back online'}
                </button>
              ) : (
                <button type="button" className="cms-btn cms-btn-danger" disabled={busy} onClick={() => save(true)}>
                  {busy ? 'Working…' : 'Take the site down for maintenance'}
                </button>
              )}
            </div>
            {state.updatedAt ? (
              <p className="cms-note">
                Last changed {new Date(state.updatedAt).toLocaleString('en-GB')}
                {state.updatedBy ? ` by ${state.updatedBy}` : ''}.
              </p>
            ) : null}
          </div>
        </div>

        <div className="cms-card">
          <div className="cms-sec-head">
            <span style={{ fontWeight: 600 }}>What visitors see</span>
          </div>
          <div className="cms-body">
            {(['en', 'he'] as const).map((locale) => (
              <div key={locale} className="cms-item">
                <div className="cms-item-bar">
                  <span className="cms-sec-id">{locale === 'en' ? 'English' : 'עברית'}</span>
                </div>
                <div className="cms-field">
                  <label htmlFor={`m-title-${locale}`}>Heading</label>
                  <input
                    id={`m-title-${locale}`}
                    type="text"
                    dir={locale === 'he' ? 'rtl' : 'ltr'}
                    value={state[locale].title}
                    onChange={(e) => edit({ [locale]: { ...state[locale], title: e.target.value } } as Partial<Maintenance>)}
                  />
                </div>
                <div className="cms-field">
                  <label htmlFor={`m-msg-${locale}`}>Message</label>
                  <textarea
                    id={`m-msg-${locale}`}
                    rows={3}
                    dir={locale === 'he' ? 'rtl' : 'ltr'}
                    value={state[locale].message}
                    onChange={(e) => edit({ [locale]: { ...state[locale], message: e.target.value } } as Partial<Maintenance>)}
                  />
                </div>
              </div>
            ))}
            <div className="cms-field" style={{ maxWidth: '14rem' }}>
              <label htmlFor="m-retry">Retry-After (minutes)</label>
              <input
                id="m-retry"
                type="text"
                inputMode="numeric"
                value={String(state.retryAfterMinutes)}
                onChange={(e) => edit({ retryAfterMinutes: Number(e.target.value.replace(/\D/g, '')) || 1 })}
              />
              <p className="cms-note">How long crawlers are told to wait before trying again.</p>
            </div>
            <div>
              <button type="button" className="cms-btn" disabled={busy} onClick={() => save(state.enabled)}>
                {busy ? 'Saving…' : 'Save the notice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
