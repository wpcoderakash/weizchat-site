'use client';

import { useEffect, useState } from 'react';
import { TextField } from './fields';

interface Row {
  username: string;
  role: 'editor' | 'admin' | 'super_admin';
  status: 'active' | 'suspended';
}

/**
 * User management, super_admin only. The bootstrap account (from the
 * environment) is listed but untouchable here — it exists precisely so
 * that no edit in this screen can ever lock the owner out.
 */
export function UserManager({ me }: { me: string }) {
  const [users, setUsers] = useState<Row[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Row['role']>('editor');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/admin/users')
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d: { users: Row[] }) => setUsers(d.users));
  }, []);

  async function call(method: string, body: unknown): Promise<boolean> {
    setBusy(true);
    setNote(null);
    const res = await fetch('/api/admin/users', {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      setNote(
        error === 'password_too_short'
          ? 'Passwords need at least 8 characters.'
          : error === 'bootstrap_account'
            ? 'The bootstrap account is managed in the environment, not here.'
            : error === 'cannot_delete_self'
              ? 'You cannot delete the account you are signed in with.'
              : 'That did not work.',
      );
      return false;
    }
    setUsers(((await res.json()) as { users: Row[] }).users);
    return true;
  }

  return (
    <>
      <div className="cms-bar">
        <h1>Users</h1>
        <div className="cms-spacer" />
        {note ? (
          <span className="cms-status cms-status-err" role="status">
            {note}
          </span>
        ) : null}
      </div>
      <div className="cms-wrap">
        <div className="cms-card" style={{ overflow: 'hidden' }}>
          <table className="cms-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.username}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{u.username}</td>
                  <td>
                    {i === 0 ? (
                      `${u.role.replace('_', ' ')} (bootstrap)`
                    ) : (
                      <select
                        aria-label={`Role for ${u.username}`}
                        value={u.role}
                        disabled={busy}
                        onChange={(e) =>
                          void call('POST', { username: u.username, role: e.target.value, status: u.status })
                        }
                      >
                        <option value="editor">editor</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super admin</option>
                      </select>
                    )}
                  </td>
                  <td>{u.status}</td>
                  <td>
                    {i === 0 ? (
                      <span className="cms-note">managed in the environment</span>
                    ) : (
                      <span style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="cms-btn"
                          disabled={busy}
                          onClick={() =>
                            void call('POST', {
                              username: u.username,
                              role: u.role,
                              status: u.status === 'active' ? 'suspended' : 'active',
                            })
                          }
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button
                          type="button"
                          className="cms-btn cms-btn-danger"
                          disabled={busy || u.username === me}
                          onClick={() => {
                            if (window.confirm(`Delete ${u.username}?`))
                              void call('DELETE', { username: u.username });
                          }}
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cms-card">
          <div className="cms-sec-head">
            <span style={{ fontWeight: 600 }}>Add a user</span>
          </div>
          <div className="cms-body">
            <div className="cms-grid">
              <TextField label="Username (email works well)" value={username} onChange={setUsername} />
              <div className="cms-field">
                <label htmlFor="new-user-password">Password (min 8 characters)</label>
                <input
                  id="new-user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="cms-field">
                <label htmlFor="new-user-role">Role</label>
                <select id="new-user-role" value={role} onChange={(e) => setRole(e.target.value as Row['role'])}>
                  <option value="editor">editor — pages, posts, media</option>
                  <option value="admin">admin — + global content</option>
                  <option value="super_admin">super admin — + users</option>
                </select>
              </div>
            </div>
            <div>
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                disabled={busy || !username || password.length < 8}
                onClick={async () => {
                  if (await call('POST', { username, password, role, status: 'active' })) {
                    setUsername('');
                    setPassword('');
                  }
                }}
              >
                Add user
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
