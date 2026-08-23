'use client';

import { useState } from 'react';

/** The CMS sign-in. One password, one failure message. */
export function LoginForm() {
  const [username, setUsername] = useState('');
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
      body: JSON.stringify({ username, password }),
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
    window.location.href = '/admin/landing/en';
  }

  return (
    <div className="cms-login">
      <form onSubmit={submit} className="cms-card" style={{ padding: '1.25rem' }}>
        <h1 style={{ marginTop: 0, fontSize: '1.1rem' }}>WeizChat CMS</h1>
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
          <input
            id="cms-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="cms-status cms-status-err" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="cms-btn cms-btn-primary" disabled={busy || !username || !password}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
