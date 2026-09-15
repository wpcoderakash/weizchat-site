/**
 * The contact form's notification (owner request, 2026-09-15: "contact form
 * don't send email").
 *
 * Everything here is a failure that is invisible from the outside: the form
 * answers 201 either way, so the only evidence that an email was or was not
 * sent is on the server. These checks pin the parts that decide it.
 *
 * Runs without a server and without touching Microsoft — `fetch` is a stub.
 * The TS modules are compiled with the repo's own tsc, the same way
 * check-contact.mjs does it, so there is no new dependency and no drift
 * between what is checked and what ships.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fails++;
};

const out = path.join(process.cwd(), 'node_modules', '.cache', 'weiz-lead-mail-check');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
execFileSync(
  'npx',
  ['tsc', 'src/lib/lead-mail.ts',
   '--outDir', out, '--module', 'esnext', '--target', 'es2022',
   '--moduleResolution', 'bundler', '--skipLibCheck', '--strict', 'false'],
  { stdio: 'pipe' },
);
fs.writeFileSync(path.join(out, 'package.json'), '{"type":"module"}');
for (const file of fs.globSync('**/*.js', { cwd: out })) {
  const full = path.join(out, file);
  fs.writeFileSync(
    full,
    fs.readFileSync(full, 'utf8').replace(/(from\s+['"]\.[^'"]*?)(['"])/g, (m, spec, q) =>
      spec.endsWith('.js') ? m : `${spec}.js${q}`),
  );
}

const mail = await import(pathToFileURL(path.join(out, 'lib/lead-mail.js')).href);

const lead = {
  id: '11111111-2222-3333-4444-555555555555',
  createdAt: '2026-09-15T10:00:00.000Z',
  status: 'new',
  source: 'contact',
  locale: 'he',
  name: 'Dana Levi',
  company: 'Levi Parts',
  phone: '+972544747742',
  email: 'dana@example.com',
  message: 'Do you support two numbers on one account?',
};

const CONFIG = {
  tenantId: 't', clientId: 'c', clientSecret: 's',
  from: 'chat@weiz.co.il', to: 'owner@weiz.co.il',
};

// ── The message itself ──────────────────────────────────────────────────────
const { subject, text } = mail.renderLeadEmail(lead);
check('the subject names who wrote in', subject.includes('Dana Levi'), subject);
check('a waitlist signup says so, not "contact form"',
  mail.renderLeadEmail({ ...lead, source: 'waitlist' }).subject.includes('waitlist'));
for (const field of ['Dana Levi', 'Levi Parts', 'dana@example.com', '+972544747742',
                     'Do you support two numbers on one account?', 'Hebrew'])
  check(`the body carries ${field}`, text.includes(field));
check('the body links to the admin', text.includes('/admin/leads'), '');
check('a missing email says how to reply instead',
  mail.renderLeadEmail({ ...lead, email: '' }).text.includes('no email address'));

// A visitor controls the name. A subject line is one line.
const hostile = mail.renderLeadEmail({ ...lead, name: 'Eve\r\nBcc: evil@example.com' });
check('a visitor cannot put a newline in the subject',
  !/[\r\n]/.test(hostile.subject), JSON.stringify(hostile.subject));

// ── What is actually sent to Graph ──────────────────────────────────────────
function stubFetch(sendResponse) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('login.microsoftonline.com')) {
      return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }),
        { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return sendResponse();
  };
  return { impl, calls };
}

const accepted = () => new Response(null, { status: 202 });
const ok = stubFetch(accepted);
await mail.sendLeadNotification(CONFIG, lead, ok.impl);
const sendCall = ok.calls.find((c) => c.url.includes('graph.microsoft.com'));
check('it posts sendMail as the configured sender',
  sendCall?.url.endsWith('/users/chat%40weiz.co.il/sendMail'), sendCall?.url);
const body = JSON.parse(sendCall.init.body);
check('the notification goes to the configured address',
  body.message.toRecipients[0].emailAddress.address === 'owner@weiz.co.il');
check('Reply goes to the visitor, not the sending mailbox',
  body.message.replyTo?.[0]?.emailAddress?.address === 'dana@example.com',
  JSON.stringify(body.message.replyTo));
check('the visitor’s words are sent as text, never as markup',
  body.message.body.contentType === 'Text');
check('it does not fill the sending mailbox’s Sent Items',
  JSON.parse(sendCall.init.body).saveToSentItems === false ||
  JSON.parse(sendCall.init.body).message !== undefined && sendCall.init.body.includes('"saveToSentItems":false'));

// No Reply-To at all is better than a broken one.
const noEmail = stubFetch(accepted);
await mail.sendLeadNotification(CONFIG, { ...lead, email: 'not an address' }, noEmail.impl);
const noEmailBody = JSON.parse(noEmail.calls.find((c) => c.url.includes('graph')).init.body);
check('a malformed address sets no Reply-To', noEmailBody.message.replyTo === undefined);

// ── Failures are named, and never reach the visitor ─────────────────────────
const reasons = [
  [401, 'auth_failed'],
  [403, 'permission_denied'],
  [500, 'rejected'],
];
for (const [status, reason] of reasons) {
  const stub = stubFetch(() => new Response(JSON.stringify({ error: { code: 'X' } }),
    { status, headers: { 'content-type': 'application/json' } }));
  let got = null;
  try { await mail.sendLeadNotification({ ...CONFIG, clientId: `c${status}` }, lead, stub.impl); }
  catch (e) { got = e.reason; }
  check(`HTTP ${status} is reported as ${reason}`, got === reason, String(got));
}

// ── The rule the whole design rests on ──────────────────────────────────────
// The lead is already on disk. A mail failure is the visitor's problem in no
// sense whatsoever, so it must not become an exception the route can see.
const previous = { warn: console.warn, error: console.error, log: console.log };
const lines = [];
console.warn = console.error = console.log = (m) => lines.push(String(m));
let threw = false;
try { await mail.notifyNewLead(lead); } catch { threw = true; }
console.warn = previous.warn; console.error = previous.error; console.log = previous.log;
check('an unconfigured site sends nothing and throws nothing', !threw);
check('and says so in the log, naming what is missing',
  lines.some((l) => l.includes('not configured') && l.includes('LEADS_NOTIFY_TO')),
  lines.join(' | '));

// ── The wiring ──────────────────────────────────────────────────────────────
const route = fs.readFileSync('src/app/api/leads/route.ts', 'utf8');
check('the route notifies on a stored lead', route.includes('notifyNewLead'));
check('and does it after the response, so the visitor never waits on Microsoft',
  /after\(\(\)\s*=>\s*notifyNewLead/.test(route));
// Compared against the call sites, not the import at the top of the file.
check('the lead is stored before it is announced',
  route.indexOf('= addLead(') < route.indexOf('after(() => notifyNewLead'));

const preflight = fs.readFileSync('scripts/preflight.mjs', 'utf8');
check('the deploy refuses a half-configured notification',
  preflight.includes('LEADS_MS_CLIENT_SECRET') && preflight.includes('half-configured'));

console.log(fails === 0 ? '\nlead mail OK' : `\n${fails} failed`);
process.exit(fails === 0 ? 0 : 1);
