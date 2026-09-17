'use client';

import { useEffect, useState } from 'react';
import { EyeIcon } from './eye-icon';
import { WeizLogo } from '../weiz-logo';

/** The CMS sign-in. One password, one failure message. */
export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  /** Epoch ms the lockout ends, or null. Drives the countdown below. */
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  /**
   * The wait as it was when the lock began, announced once.
   *
   * `role="alert"` is implicitly assertive, so ANY change to the text inside
   * it is re-announced. The clock is `aria-hidden` and so invisible to that,
   * but a spoken "N minutes" derived from `remaining` would still change on
   * every minute boundary and interrupt the operator again. Fixing it at the
   * moment of the lock means the sentence is spoken once and then left alone,
   * while the digits keep moving for the people who can see them.
   */
  const [lockMinutes, setLockMinutes] = useState(0);

  /*
   * The countdown.
   *
   * A static "try again in 10 minutes" is read once and then becomes a
   * question — how long is left NOW? Someone waiting reloads the page to find
   * out, which tells them nothing because the message is gone. A ticking
   * number answers it continuously and, more usefully, ends by itself: when it
   * reaches zero the form clears and re-enables, so the operator knows the
   * moment they may try again without guessing.
   */
  useEffect(() => {
    if (lockedUntil === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setLockedUntil(null);
        setError(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const locked = lockedUntil !== null && remaining > 0;
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;

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
      // A lockout says so. Everything else is one message.
      //
      // The 429 and its `retry-after` are already on the wire, so naming the
      // lockout here tells an attacker nothing they cannot read from the
      // response themselves. What it does do is stop the LEGITIMATE operator
      // being told their correct password is wrong — which is exactly what
      // happened the first time this shipped, and cost half an hour of
      // believing the hashing had broken.
      //
      // The distinction that still matters is the one kept below: a wrong
      // username, a wrong password and an unconfigured admin remain
      // indistinguishable, because THAT difference is the oracle.
      if (res.status === 429) {
        // `retry-after` is the server's own number, not a guess from the
        // budget: whatever the lockout actually has left is what the operator
        // is shown. A missing header falls back to the configured ten minutes
        // rather than to zero, which would tell them to retry immediately and
        // be wrong.
        const seconds = Number(res.headers.get('retry-after') ?? '') || 600;
        setLockMinutes(Math.max(1, Math.ceil(seconds / 60)));
        setLockedUntil(Date.now() + seconds * 1000);
        return;
      }
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
      <form onSubmit={submit} className="cms-card cms-login-card">
        <header className="cms-login-head">
          <WeizLogo width={148} priority />
          <h1 className="cms-login-plane">Content Manager</h1>
        </header>
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
              className="cms-reveal"
              onClick={() => setReveal((r) => !r)}
              aria-pressed={reveal}
              aria-label={reveal ? 'Hide password' : 'Show password'}
              title={reveal ? 'Hide password' : 'Show password'}
            >
              <EyeIcon off={reveal} />
            </button>
          </div>
        </div>
        {locked ? (
          <p className="cms-status cms-status-err" role="alert">
            {/* aria-live off on the clock itself: announcing a new number every
                second would make the page unusable with a screen reader. The
                sentence is announced once by role="alert"; the digits update
                silently for the people who can see them. */}
            Too many sign-in attempts. Try again in{' '}
            <strong aria-hidden="true">{clock}</strong>
            <span className="sr-only">
              {lockMinutes} minute{lockMinutes === 1 ? '' : 's'}
            </span>
            .
          </p>
        ) : error ? (
          <p className="cms-status cms-status-err" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="cms-btn cms-btn-primary cms-login-submit"
          disabled={busy || locked || !username.trim() || !password.trim()}
        >
          {busy ? 'Checking…' : locked ? `Locked — ${clock}` : 'Sign in'}
        </button>

        <p className="cms-login-foot">
          <a href="/">Back to weiz.chat</a>
        </p>
      </form>
    </div>
  );
}
