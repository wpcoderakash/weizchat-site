'use client';

import { useState } from 'react';

/** The CMS sign-in. One password, one failure message. */
export function LoginForm() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      // One message for every failure: a wrong password and an unconfigured
      // admin must not be distinguishable from out here.
      setError('That password was not accepted.');
      return;
    }
    // A full load, not a client push: the editor's initial state is
    // server-rendered from the store, and a soft navigation would keep
    // the previous locale's document in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/admin/landing/en';
  }

  return (
    <div className="cms-login">
      <form onSubmit={submit} className="cms-card" style={{ padding: '1.25rem' }}>
        <h1 style={{ marginTop: 0, fontSize: '1.1rem' }}>WeizChat CMS</h1>
        <div className="cms-field">
          <label htmlFor="cms-password">Password</label>
          <input
            id="cms-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>
        {error ? (
          <p className="cms-status cms-status-err" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="cms-btn cms-btn-primary" disabled={busy || !password}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
