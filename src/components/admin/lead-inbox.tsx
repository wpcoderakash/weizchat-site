'use client';

import { useEffect, useState } from 'react';
import type { Lead } from '../../cms/leads';

/**
 * The Form Leads inbox. Rows are visitor-typed text — rendered strictly
 * as text. Leads are personal data, so every row can be deleted, and the
 * delete asks first.
 */
export function LeadInbox() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/admin/leads');
    if (res.ok) setLeads((await res.json()).leads as Lead[]);
    else setNote('Could not load leads.');
  }

  useEffect(() => {
    // A microtask hop keeps the initial fetch out of the render pass.
    const t = setTimeout(refresh, 0);
    return () => clearTimeout(t);
  }, []);

  async function flip(lead: Lead) {
    const status = lead.status === 'new' ? 'handled' : 'new';
    const res = await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: lead.id, status }),
    });
    if (res.ok) refresh();
    else setNote('Update failed.');
  }

  async function remove(lead: Lead) {
    if (!window.confirm('Delete this lead permanently? It cannot be recovered.')) return;
    const res = await fetch('/api/admin/leads', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: lead.id }),
    });
    if (res.ok) refresh();
    else setNote('Delete failed.');
  }

  return (
    <>
      <div className="cms-bar">
        <h1>Form Leads</h1>
        {note ? <span className="cms-status cms-status-err">{note}</span> : null}
      </div>
      <div className="cms-wrap" style={{ maxWidth: '72rem' }}>
        <p className="cms-note">
          Everything the contact form and the waitlists captured. Leads are personal data —
          delete a row once it is dealt with, or when the person asks.
        </p>
        <div className="cms-card" style={{ overflowX: 'auto' }}>
          {leads === null ? (
            <p className="cms-empty">Loading…</p>
          ) : leads.length === 0 ? (
            <p className="cms-empty">No leads yet — submissions land here the moment they arrive.</p>
          ) : (
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Source</th>
                  <th>Who</th>
                  <th>Reach them at</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(l.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>{l.source === 'contact' ? 'Contact form' : 'Waitlist'}</td>
                    <td>
                      {l.name || '—'}
                      {l.company ? <span className="cms-note"> · {l.company}</span> : null}
                    </td>
                    <td dir="ltr">{[l.phone, l.email].filter(Boolean).join(' · ') || '—'}</td>
                    <td style={{ maxWidth: '22rem' }}>{l.message || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={l.status === 'new' ? 'cms-badge-draft' : 'cms-badge-live'}
                        onClick={() => flip(l)}
                        title="Toggle handled"
                        style={{ border: 'none', cursor: 'pointer', font: 'inherit', fontSize: '0.72rem' }}
                      >
                        {l.status === 'new' ? 'New' : 'Handled'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="cms-btn cms-btn-icon cms-btn-danger"
                        onClick={() => remove(l)}
                        aria-label="Delete lead"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
