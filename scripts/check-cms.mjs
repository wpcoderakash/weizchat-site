/**
 * The full-CMS verification, against a built server (`pnpm start`).
 *
 * Exercises what the brief's final checklist demands, over HTTP like a
 * real admin: auth and roles, the draft→publish→revalidate loop on every
 * page KIND, global content reaching every page, posts end to end,
 * preview via draft mode, media upload/delete, and user management.
 * Failing any step exits non-zero.
 */
import { createRequire } from 'node:module';
const require = createRequire('/Users/akashbiswas/Desktop/whatsapp sass Project/package.json');
import { cmsCredentials } from './lib/credentials.mjs';
const { chromium } = require('@playwright/test');

const B = process.env.BASE ?? 'http://localhost:3002';
const ADMIN = cmsCredentials();
let fails = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!ok) fails += 1;
};

async function signIn(credentials) {
  const res = await fetch(`${B}/api/admin/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) return null;
  return res.headers.get('set-cookie')?.match(/weizchat_cms=([^;]+)/)?.[1] ?? null;
}
const jar = (token) => ({ cookie: `weizchat_cms=${token}` });
const api = (token, path, init = {}) =>
  fetch(`${B}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...jar(token), ...(init.headers ?? {}) },
  });
const pageText = async (path) => {
  const res = await fetch(`${B}${path}`, { cache: 'no-store' });
  return { status: res.status, text: await res.text() };
};

// ── 1. Auth & roles ────────────────────────────────────────────────────────
check('anonymous docs API is 401', (await fetch(`${B}/api/admin/docs/page/pricing/en`)).status === 401);
check('anonymous users API is 403', (await fetch(`${B}/api/admin/users`)).status === 403);
const admin = await signIn(ADMIN);
check('bootstrap super admin signs in', admin !== null);

// create an editor, prove the ladder
await api(admin, '/api/admin/users', {
  method: 'POST',
  body: JSON.stringify({ username: 'writer@test.local', password: 'Writer-Pass-1', role: 'editor', status: 'active' }),
});
const editor = await signIn({ username: 'writer@test.local', password: 'Writer-Pass-1' });
check('created editor signs in', editor !== null);
const editorGlobal = await api(editor, '/api/admin/docs/global/site/en', {
  method: 'PUT',
  body: JSON.stringify({}),
});
check('editor may NOT write global content', editorGlobal.status === 403, String(editorGlobal.status));
await api(admin, '/api/admin/users', {
  method: 'POST',
  body: JSON.stringify({ username: 'writer@test.local', role: 'editor', status: 'suspended' }),
});
const suspended = await api(editor, '/api/admin/docs/page/pricing/en');
check('suspended editor is locked out', suspended.status === 401, String(suspended.status));
check('suspended editor cannot sign in', (await signIn({ username: 'writer@test.local', password: 'Writer-Pass-1' })) === null);

// ── 2. Page kind: solution — draft vs publish ──────────────────────────────
{
  const get = await api(admin, '/api/admin/docs/page/shared-inbox/en');
  const { doc } = await get.json();
  doc.title = 'CMS EDITED HEADLINE';
  doc.features = [...doc.features].reverse();
  await api(admin, '/api/admin/docs/page/shared-inbox/en', { method: 'PUT', body: JSON.stringify(doc) });
  let pub = await pageText('/shared-inbox');
  check('saved draft does NOT reach the public page', !pub.text.includes('CMS EDITED HEADLINE'));
  await api(admin, '/api/admin/docs/page/shared-inbox/en', { method: 'POST', body: JSON.stringify({ action: 'publish' }) });
  pub = await pageText('/shared-inbox');
  check('published edit reaches the public page', pub.text.includes('CMS EDITED HEADLINE'));
  check(
    'repeater order follows the CMS (reversed)',
    pub.text.indexOf('Roles &amp; permissions') < pub.text.indexOf('Assignments &amp; statuses'),
  );
  await api(admin, '/api/admin/docs/page/shared-inbox/en', { method: 'POST', body: JSON.stringify({ action: 'unpublish' }) });
  pub = await pageText('/shared-inbox');
  check('unpublish restores built-in content', pub.text.includes('One number, whole team'));
  await api(admin, '/api/admin/docs/page/shared-inbox/en', { method: 'DELETE' });
}

// ── 3. Page kind: legal (markdown) + Hebrew path revalidation ──────────────
{
  const get = await api(admin, '/api/admin/docs/page/terms/he');
  const { doc } = await get.json();
  doc.body = '# תנאים חדשים\n\nגרסה שנערכה מהמערכת.';
  await api(admin, '/api/admin/docs/page/terms/he', { method: 'PUT', body: JSON.stringify(doc) });
  await api(admin, '/api/admin/docs/page/terms/he', { method: 'POST', body: JSON.stringify({ action: 'publish' }) });
  const pub = await pageText('/heb/terms');
  check('legal markdown publish reaches /heb path', pub.text.includes('תנאים חדשים'));
  await api(admin, '/api/admin/docs/page/terms/he', { method: 'DELETE' });
  const back = await pageText('/heb/terms');
  check('legal reset restores the shipped document', back.text.includes('תנאי שימוש'));
}

// ── 4. Global content on every page ────────────────────────────────────────
{
  const get = await api(admin, '/api/admin/docs/global/site/en');
  const { doc } = await get.json();
  doc.nav.startTrial = 'CMS TRIAL BUTTON';
  doc.site.legalName = 'Weiz Test Ltd';
  await api(admin, '/api/admin/docs/global/site/en', { method: 'PUT', body: JSON.stringify(doc) });
  await api(admin, '/api/admin/docs/global/site/en', { method: 'POST', body: JSON.stringify({ action: 'publish' }) });
  const home = await pageText('/');
  const deep = await pageText('/tools/qr-code-generator');
  check('global nav change reaches the home page', home.text.includes('CMS TRIAL BUTTON'));
  check('global nav change reaches a deep page', deep.text.includes('CMS TRIAL BUTTON'));
  check('global identity change reaches the footer', home.text.includes('Weiz Test Ltd'));
  check(
    'trademark attribution survives (locked)',
    home.text.includes('independent software provider'),
  );
  await api(admin, '/api/admin/docs/global/site/en', { method: 'DELETE' });
  const restored = await pageText('/');
  check('global reset restores built-ins', !restored.text.includes('CMS TRIAL BUTTON'));
}

// ── 5. Posts: create → publish → list → unpublish → delete ─────────────────
{
  const key = { collection: 'blog', slug: 'cms-check-post', locale: 'en' };
  const doc = {
    title: 'A post born in the CMS',
    description: 'Created by the automated verification.',
    date: '2026-08-23',
    tags: ['check'],
    image: null,
    body: '# A post born in the CMS\n\nIt renders through the same pipeline.',
  };
  await api(admin, '/api/admin/posts', { method: 'PUT', body: JSON.stringify({ key, doc }) });
  let list = await pageText('/blog');
  check('draft post absent from the public blog', !list.text.includes('A post born in the CMS'));
  await api(admin, '/api/admin/posts', { method: 'POST', body: JSON.stringify({ key, action: 'publish' }) });
  list = await pageText('/blog');
  const article = await pageText('/blog/cms-check-post');
  check('published post listed on the blog', list.text.includes('A post born in the CMS'));
  check('published post renders its page', article.status === 200 && article.text.includes('same pipeline'));
  await api(admin, '/api/admin/posts', { method: 'POST', body: JSON.stringify({ key, action: 'unpublish' }) });
  const gone = await pageText('/blog/cms-check-post');
  check('unpublished post 404s', gone.status === 404, String(gone.status));
  // Override an MDX built-in, then reset back to it.
  const mdxKey = { collection: 'blog', slug: 'whatsapp-on-a-personal-phone', locale: 'en' };
  const read = await api(admin, `/api/admin/posts?collection=blog&slug=whatsapp-on-a-personal-phone&locale=en`);
  const { doc: mdxDoc } = await read.json();
  mdxDoc.title = 'OVERRIDDEN TITLE';
  await api(admin, '/api/admin/posts', { method: 'PUT', body: JSON.stringify({ key: mdxKey, doc: mdxDoc }) });
  await api(admin, '/api/admin/posts', { method: 'POST', body: JSON.stringify({ key: mdxKey, action: 'publish' }) });
  check('CMS override beats the MDX built-in', (await pageText('/blog')).text.includes('OVERRIDDEN TITLE'));
  await api(admin, '/api/admin/posts', { method: 'DELETE', body: JSON.stringify({ key: mdxKey }) });
  {
    const blog = (await pageText('/blog')).text;
    check('post reset returns the MDX built-in', !blog.includes('OVERRIDDEN TITLE') && blog.includes('employee'));
  }
  await api(admin, '/api/admin/posts', { method: 'DELETE', body: JSON.stringify({ key }) });
}

// ── 6. Preview: the draft on the REAL public route, admin-gated ────────────
{
  const get = await api(admin, '/api/admin/docs/page/pricing/en');
  const { doc } = await get.json();
  doc.title = 'DRAFT ONLY HEADLINE';
  await api(admin, '/api/admin/docs/page/pricing/en', { method: 'PUT', body: JSON.stringify(doc) });

  const b = await chromium.launch();
  const ctx = await b.newContext();
  await ctx.addCookies([
    { name: 'weizchat_cms', value: admin, url: B },
  ]);
  const p = await ctx.newPage();
  await p.goto(`${B}/api/admin/preview?redirect=/pricing`, { waitUntil: 'domcontentloaded' });
  check('preview shows the draft on the public route', (await p.locator('main h1').innerText()) === 'DRAFT ONLY HEADLINE');
  check('preview landed on the real /pricing URL', p.url() === `${B}/pricing`, p.url());
  // The same draft cookie WITHOUT a session shows published content only.
  const cookies = await ctx.cookies();
  const anon = await b.newContext();
  await anon.addCookies(cookies.filter((c) => c.name !== 'weizchat_cms'));
  const p2 = await anon.newPage();
  await p2.goto(`${B}/pricing`, { waitUntil: 'domcontentloaded' });
  check('draft cookie without a session shows published only', (await p2.locator('main h1').innerText()) !== 'DRAFT ONLY HEADLINE');
  await b.close();
  await api(admin, '/api/admin/docs/page/pricing/en', { method: 'DELETE' });
  check('public pricing untouched throughout', (await pageText('/pricing')).text.includes('Pricing that says what it costs'));
}

// ── 7. Media: upload → list → delete ───────────────────────────────────────
{
  const png = Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
      '1f15c4890000000d49444154789c626001000000ffff03000006000557bfabd40000000049454e44ae426082',
    'hex',
  );
  const form = new FormData();
  form.append('file', new File([png], 'check.png', { type: 'image/png' }));
  const up = await fetch(`${B}/api/admin/media`, { method: 'POST', headers: jar(admin), body: form });
  check('media upload accepted', up.status === 201, String(up.status));
  const { file } = await up.json();
  const listed = await (await fetch(`${B}/api/admin/media`, { headers: jar(admin) })).json();
  check('uploaded file listed', listed.files.some((f) => f.src === file.src));
  const served = await fetch(`${B}${file.src}`);
  check('uploaded file served publicly', served.status === 200);
  const del = await fetch(`${B}/api/admin/media?name=${file.name}`, { method: 'DELETE', headers: jar(admin) });
  check('media delete works', del.status === 200);
  const shipped = await fetch(`${B}/api/admin/media?name=inbox-chat.png`, { method: 'DELETE', headers: jar(admin) });
  check('shipped screenshots refuse deletion', shipped.status === 404 || shipped.status === 400, String(shipped.status));
}

// ── form leads: intake, honeypot, rate limit, inbox lifecycle ──────────────
{
  // Every run poses as a fresh forwarded IP, so repeated runs never fill
  // the real client's rate window.
  const runIp = `198.51.100.${Date.now() % 250}`;
  const post = (body, headers = {}) =>
    fetch(`${B}/api/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': runIp, ...headers },
      body: JSON.stringify(body),
    });

  const anon = await fetch(`${B}/api/admin/leads`);
  check('lead inbox requires auth', anon.status === 401, String(anon.status));

  const bad = await post({ source: 'contact', locale: 'en' });
  check('contact lead without name/message rejected', bad.status === 400, String(bad.status));

  const ok = await post({
    source: 'contact',
    locale: 'en',
    name: 'Check Lead',
    company: 'Check Co',
    phone: '+972500000000',
    message: 'A real lead from the automated check.',
  });
  check('contact lead accepted', ok.status === 201, String(ok.status));

  const wl = await post({ source: 'waitlist', locale: 'he', email: 'check@example.com' });
  check('waitlist lead accepted', wl.status === 201, String(wl.status));

  const honey = await post({
    source: 'contact', locale: 'en', name: 'Bot', message: 'spam', website: 'http://spam',
  });
  check('honeypot gets the same 201', honey.status === 201, String(honey.status));

  const list = await (await api(admin, '/api/admin/leads')).json();
  const mine = list.leads.filter((l) => l.name === 'Check Lead' || l.email === 'check@example.com');
  check('both real leads listed in the inbox', mine.length === 2, String(mine.length));
  check('honeypot submission was NOT stored', !list.leads.some((l) => l.name === 'Bot'));

  const lead = mine.find((l) => l.name === 'Check Lead');
  const flip = await api(admin, '/api/admin/leads', {
    method: 'PATCH', body: JSON.stringify({ id: lead.id, status: 'handled' }),
  });
  const after = await (await api(admin, '/api/admin/leads')).json();
  check('lead marked handled', flip.ok && after.leads.find((l) => l.id === lead.id)?.status === 'handled');

  // The rate limit, exercised on a spoofed forwarded IP so repeat runs of
  // this suite never trip it for the real client.
  const spoof = { 'x-forwarded-for': '203.0.113.99' };
  let last = 0;
  for (let i = 0; i < 11; i++) {
    last = (await post({ source: 'waitlist', locale: 'en', email: `rl${i}@example.com`, website: 'x' }, spoof)).status;
  }
  check('rate limit answers 429 after the window fills', last === 429, String(last));

  // cleanup: leads are personal data — the check deletes what it created.
  const final = await (await api(admin, '/api/admin/leads')).json();
  for (const l of final.leads.filter((x) => x.name === 'Check Lead' || x.email === 'check@example.com')) {
    await api(admin, '/api/admin/leads', { method: 'DELETE', body: JSON.stringify({ id: l.id }) });
  }
  const empty = await (await api(admin, '/api/admin/leads')).json();
  check('lead delete works', !empty.leads.some((x) => x.name === 'Check Lead' || x.email === 'check@example.com'));
}

// cleanup: remove the test user
await api(admin, '/api/admin/users', { method: 'DELETE', body: JSON.stringify({ username: 'writer@test.local' }) });

console.log(fails === 0 ? '\nALL CMS CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
