/**
 * Refuse to start a broken deployment.
 *
 * Three of this app's inputs are read from disk while it serves, not bundled:
 * the built-in messages, the shipped MDX, and the writable content store. If a
 * release is missing one, the failure is quiet and awful — legal pages 500, or
 * the CMS comes up with an empty store and the site silently serves built-in
 * copy as though nothing had ever been published.
 *
 * So: check first, say exactly what is wrong, and exit non-zero.
 *
 * Run it in the deploy, and again from the start command.
 */
import fs from 'node:fs';
import path from 'node:path';

const problems = [];
const notes = [];

function resolveDir(envName, fallback) {
  const value = process.env[envName];
  return value && value.trim() !== '' ? path.resolve(value) : path.join(process.cwd(), fallback);
}

// ── Content the app reads at runtime ────────────────────────────────────────
const contentDir = resolveDir('WEIZ_CONTENT_DIR', 'src/content');
const messagesDir = resolveDir('WEIZ_MESSAGES_DIR', 'messages');

for (const [label, dir, mustContain] of [
  ['built-in MDX (WEIZ_CONTENT_DIR)', contentDir, ['legal', 'articles']],
  ['i18n messages (WEIZ_MESSAGES_DIR)', messagesDir, ['en.json', 'he.json']],
]) {
  if (!fs.existsSync(dir)) {
    problems.push(`${label} is missing: ${dir}`);
    continue;
  }
  for (const entry of mustContain) {
    if (!fs.existsSync(path.join(dir, entry))) {
      problems.push(`${label} has no ${entry}: ${path.join(dir, entry)}`);
    }
  }
}

// ── The writable store ──────────────────────────────────────────────────────
const storeDir = resolveDir('WEIZ_CONTENT_STORE', 'content-store');
try {
  fs.mkdirSync(storeDir, { recursive: true });
  const probe = path.join(storeDir, '.write-probe');
  fs.writeFileSync(probe, 'ok');
  fs.unlinkSync(probe);
} catch (error) {
  problems.push(`the content store is not writable: ${storeDir} (${String(error).slice(0, 90)})`);
}
if (process.env.NODE_ENV === 'production' && storeDir.includes(`${path.sep}.next${path.sep}`)) {
  problems.push(
    `the content store is inside the build output (${storeDir}) — the next deploy would erase every published page. Set WEIZ_CONTENT_STORE to a directory outside the release.`,
  );
}

// ── Credentials ─────────────────────────────────────────────────────────────
const user = process.env.CMS_ADMIN_USERNAME;
const password = process.env.CMS_ADMIN_PASSWORD;
if (!user || !password) {
  problems.push('CMS_ADMIN_USERNAME and CMS_ADMIN_PASSWORD must both be set — the admin refuses to run without them');
} else if (password.length < 8) {
  problems.push('CMS_ADMIN_PASSWORD is shorter than 8 characters');
} else if (/REPLACE_ME|changeme|password/i.test(password)) {
  problems.push('CMS_ADMIN_PASSWORD still looks like the example value');
}
// The floor is the application's own (8, the NIST 800-63B minimum), not a
// stricter one invented here: the owner chooses this password, and a deploy
// script is the wrong place to overrule them. Length was never the real
// protection anyway — a password that has been shared is weak at any length.


// ── Things worth knowing, but not fatal ─────────────────────────────────────
if (!process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION) {
  notes.push('NEXT_PUBLIC_META_DOMAIN_VERIFICATION is unset — the Meta domain-verification meta tag will not be emitted');
}

// The bot check on the public forms is optional by design: the contact form
// is how a stranger reaches this business, and a missing variable must not
// quietly close it. Optional is not the same as unnoticed.
// The site key is a BUILD-time value: Next inlines NEXT_PUBLIC_* into the
// client bundle, so on a server it is normally absent from the environment and
// present in the JavaScript instead. Checking the env alone would have failed
// every correct deployment — look where the value actually is.
function builtSiteKey() {
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_ID) return true;
  const chunks = path.join(process.cwd(), '.next', 'static', 'chunks');
  if (!fs.existsSync(chunks)) return false;
  const stack = [chunks];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.js') && /0x4[A-Za-z0-9_-]{10,}/.test(fs.readFileSync(full, 'utf8')))
        return true;
    }
  }
  return false;
}

const siteKey = builtSiteKey();
const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
if (!siteKey && !turnstileSecret) {
  notes.push(
    'no Turnstile keys — the contact form and the waitlist run on the honeypot and the rate limit alone. Set NEXT_PUBLIC_TURNSTILE_SITE_ID and TURNSTILE_SECRET_KEY to add the bot check.',
  );
} else if (!siteKey || !turnstileSecret) {
  // One without the other is the dangerous shape: a secret with no widget
  // means every submission is refused, and a widget with no secret means the
  // visitor solves a puzzle that is never checked.
  problems.push(
    !siteKey
      ? 'TURNSTILE_SECRET_KEY is set but no Turnstile site key is built into this release — no widget would render and every form submission would be refused. NEXT_PUBLIC_* is inlined at build time, so set NEXT_PUBLIC_TURNSTILE_SITE_ID on the machine that BUILDS (.env.production), not on the server.'
      : 'a Turnstile site key is built into this release but TURNSTILE_SECRET_KEY is not set on this server — visitors would solve a challenge nobody verifies',
  );
}
const placeholderHits = [];
for (const dir of ['legal']) {
  const full = path.join(contentDir, dir);
  if (!fs.existsSync(full)) continue;
  for (const file of fs.readdirSync(full).filter((f) => f.endsWith('.mdx'))) {
    const text = fs.readFileSync(path.join(full, file), 'utf8');
    const found = [...new Set(text.match(/__[A-Z_]+__/g) ?? [])];
    if (found.length) placeholderHits.push(`${file}: ${found.join(', ')}`);
  }
}
if (placeholderHits.length) {
  notes.push(
    `legal pages still contain owner placeholders — they render literally to visitors:\n    ${placeholderHits.join('\n    ')}`,
  );
}

for (const note of notes) console.log(`NOTE  ${note}`);
if (problems.length === 0) {
  console.log('PREFLIGHT OK');
  process.exit(0);
}
for (const problem of problems) console.error(`FAIL  ${problem}`);
console.error(`\n${problems.length} problem(s) — not starting.`);
process.exit(1);
