'use client';

import { useState } from 'react';
import type { Role } from '../../cms/auth';

const MIN = 12;

/**
 * Change your own password, from the dashboard.
 *
 * The current password is required: a session cookie is enough to act as
 * someone, and it must not also be enough to lock them out of their site.
 * Both new-password fields are visible-on-demand — a password you cannot
 * read is a password you can mistype twice.
 */
export function ProfileForm({ username, role }: { username: string; role: Role }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const mismatch = confirm !== '' && next !== confirm;
  const tooShort = next !== '' && next.length < MIN;
  const ready = current !== '' && next.length >= MIN && next === confirm && !busy;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword: current.trim(), newPassword: next.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (res.ok) {
        setNote({ kind: 'ok', text: 'Password changed. Use the new one next time you sign in.' });
        setCurrent('');
        setNext('');
        setConfirm('');
      } else {
        setNote({ kind: 'err', text: data.message ?? 'The password could not be changed.' });
      }
    } catch {
      setNote({ kind: 'err', text: 'The server could not be reached.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="cms-bar">
        <h1>Profile</h1>
      </div>
      <div className="cms-wrap cms-wrap-narrow">
        <div className="cms-card">
          <div className="cms-sec-head">
            <span style={{ fontWeight: 600 }}>Account</span>
          </div>
          <div className="cms-body">
            <div className="cms-field">
              <label htmlFor="p-user">Signed in as</label>
              <input id="p-user" type="text" value={username} readOnly />
            </div>
            <p className="cms-note">
              Role: <strong>{role.replace('_', ' ')}</strong>. The username is set on the server
              and cannot be changed here.
            </p>
          </div>
        </div>

        <form className="cms-card" onSubmit={submit}>
          <div className="cms-sec-head">
            <span style={{ fontWeight: 600 }}>Change password</span>
            <div className="cms-spacer" />
            <button
              type="button"
              className="cms-btn cms-btn-icon"
              onClick={() => setReveal((r) => !r)}
              aria-pressed={reveal}
            >
              {reveal ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="cms-body">
            <div className="cms-field">
              <label htmlFor="p-current">Current password</label>
              <input
                id="p-current"
                type={reveal ? 'text' : 'password'}
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div className="cms-field">
              <label htmlFor="p-new">New password</label>
              <input
                id="p-new"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
              <p className="cms-note">
                At least {MIN} characters. No single quotes or line breaks — the server keeps this
                one in a file that a shell reads.
              </p>
            </div>
            <div className="cms-field">
              <label htmlFor="p-confirm">Repeat new password</label>
              <input
                id="p-confirm"
                type={reveal ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {tooShort ? (
              <p className="cms-status cms-status-err">Too short — {MIN} characters or more.</p>
            ) : null}
            {mismatch ? (
              <p className="cms-status cms-status-err">The two new passwords do not match.</p>
            ) : null}
            {note ? (
              <p
                className={note.kind === 'ok' ? 'cms-status cms-status-ok' : 'cms-status cms-status-err'}
                role="status"
              >
                {note.text}
              </p>
            ) : null}

            <div>
              <button type="submit" className="cms-btn cms-btn-primary" disabled={!ready}>
                {busy ? 'Changing…' : 'Change password'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
