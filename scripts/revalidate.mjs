/**
 * Post-deploy revalidation.
 *
 * The public pages are prerendered at build time, on this Mac, where there
 * is no content store — so a fresh release ships HTML built from the
 * built-in defaults (`__LEGAL_NAME__` and friends). The server then serves
 * that prerender until something invalidates it, which meant every deploy
 * silently replaced the owner's published content with placeholders until
 * the next CMS publish happened to fix it.
 *
 * Publishing the global document calls `revalidatePath('/', 'layout')`,
 * which rebuilds the whole tree from the store. Doing it here makes the
 * deploy self-correcting.
 *
 * Credentials are read on this machine only and never leave it — they are
 * sent to the site's own login endpoint over TLS, exactly as a browser
 * would. Nothing is written to the server.
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.REVALIDATE_BASE ?? 'https://www.weiz.chat';

function creds() {
  let u = process.env['CMS_ADMIN_USERNAME'];
  let p = process.env['CMS_ADMIN_PASSWORD'];
  for (const name of ['.env.local', '.deploy.env']) {
    const f = path.join(process.cwd(), name);
    if ((u && p) || !fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = /^\s*(CMS_ADMIN_USERNAME|CMS_ADMIN_PASSWORD)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      const v = m[2].replace(/^["']|["']$/g, '');
      if (m[1].endsWith('USERNAME')) u ||= v;
      else p ||= v;
    }
  }
  return { u, p };
}

const { u, p } = creds();
if (!u || !p) {
  // Not fatal: a deploy that cannot revalidate is still a deploy. But say so
  // loudly, because the symptom (placeholders on a live page) looks like
  // lost content rather than a stale cache.
  console.log('WARN  no CMS admin credentials found — skipping revalidation.');
  console.log('      The site may show __PLACEHOLDER__ values until you publish');
  console.log('      anything from the CMS. Set CMS_ADMIN_USERNAME / _PASSWORD.');
  process.exit(0);
}

const login = await fetch(`${BASE}/api/admin/session`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: u, password: p }),
});
if (!login.ok) {
  console.log(`WARN  could not sign in to revalidate (${login.status}).`);
  process.exit(0);
}
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');

// English carries the layout revalidation for every locale; Hebrew is
// attempted too and a 409 simply means it has nothing published to refresh.
let ok = false;
for (const locale of ['en', 'he']) {
  const res = await fetch(`${BASE}/api/admin/docs/global/site/${locale}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ action: 'publish' }),
  });
  if (res.ok) ok = true;
  console.log(`    revalidate ${locale}: ${res.status}${res.status === 409 ? ' (nothing published — fine)' : ''}`);
}
console.log(ok ? '    published content is live again' : 'WARN  nothing was revalidated');
