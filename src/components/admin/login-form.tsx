'use client';

import { useState } from 'react';
import { WeizLogo } from '../weiz-logo';

/** The CMS sign-in. One password, one failure message. */
export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // Trimmed: an admin password is copied and pasted, and a stray space
      // carried along by the clipboard is indistinguishable from a wrong
      // password once it reaches the server. Surrounding whitespace is never
      // part of what someone meant to type.
      body: JSON.stringify({ username: username.trim(), password: password.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      // One message for every failure: a wrong username, a wrong password
      // and an unconfigured admin must look identical from out here.
      setError('Those details were not accepted.');
      return;
    }
    // A full load, not a client push: the editor's initial state is
    // server-rendered from the store, and a soft navigation would keep
    // the previous locale's document in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/admin';
  }

  return (
    <div className="cms-login">
      <form onSubmit={submit} className="cms-card" style={{ padding: '1.25rem' }}>
        <WeizLogo width={150} priority />
        <h1 style={{ margin: '0.35rem 0 0', fontSize: '0.95rem', color: 'var(--cms-muted)' }}>
          Content Manager
        </h1>
        <div className="cms-field">
          <label htmlFor="cms-username">Username</label>
          <input
            id="cms-username"
            type="text"
            inputMode="email"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="cms-field">
          <label htmlFor="cms-password">Password</label>
          <div className="cms-password-row">
            <input
              id="cms-password"
              type={reveal ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Sign-in is where a mistyped character is invisible and the
                only feedback is a flat refusal. Letting someone look is
                worth more than hiding it from a shoulder they chose. */}
            <button
              type="button"
              className="cms-btn cms-btn-icon"
              onClick={() => setReveal((r) => !r)}
              aria-pressed={reveal}
              aria-label={reveal ? 'Hide password' : 'Show password'}
              title={reveal ? 'Hide password' : 'Show password'}
            >
              {reveal ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        {error ? (
          <p className="cms-status cms-status-err" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="cms-btn cms-btn-primary" disabled={busy || !username.trim() || !password.trim()}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
