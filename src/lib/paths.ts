import path from 'node:path';

/**
 * Every directory the app touches at RUNTIME, in one place.
 *
 * This exists because of deployment. Three of these are read by server code
 * while the site is serving, not bundled by the compiler:
 *
 * - `messages/` and `src/content/` are the built-in content the CMS falls back
 *   to. A `next build --output standalone` bundle does not include them, so a
 *   deploy that forgets them serves 500s on every legal page.
 * - `content-store/` is the CMS's database: documents, users, leads, uploaded
 *   media. It must survive a deploy, which means living OUTSIDE the release
 *   directory on a real host.
 *
 * Each can be pointed anywhere with an environment variable. The defaults
 * reproduce the old cwd-relative behaviour exactly, so development is
 * unchanged and nothing needs configuring to run locally.
 */

function fromEnv(name: string, ...fallback: string[]): string {
  const value = process.env[name];
  if (value && value.trim() !== '') return path.resolve(value);
  return path.join(process.cwd(), ...fallback);
}

/** The CMS's writable store: documents, users, leads, uploaded media. */
export const STORE_DIR = fromEnv('WEIZ_CONTENT_STORE', 'content-store');

/** Uploaded media, served by /media/[name]. */
export const MEDIA_DIR = path.join(STORE_DIR, 'media');

/** Lead submissions from the contact form and the waitlists. */
export const LEADS_DIR = path.join(STORE_DIR, 'leads');

/** The CMS user table. */
export const USERS_FILE = path.join(STORE_DIR, 'users.json');

/** Shipped MDX: legal bodies and articles. Read-only at runtime. */
export const CONTENT_DIR = fromEnv('WEIZ_CONTENT_DIR', 'src', 'content');

/** Shipped i18n messages, the source of the built-in copy. Read-only. */
export const MESSAGES_DIR = fromEnv('WEIZ_MESSAGES_DIR', 'messages');

/** Screenshots that ship with the repo and appear in the media library. */
export const PUBLIC_DIR = fromEnv('WEIZ_PUBLIC_DIR', 'public');
