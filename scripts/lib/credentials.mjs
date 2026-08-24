import fs from 'node:fs';
import path from 'node:path';

/**
 * The CMS credentials the check scripts sign in with.
 *
 * Deliberately NOT hard-coded: these scripts are in a published repository,
 * and a password committed to git is a password to rotate, not a convenience.
 * They come from the environment, or from `.env.local` — the same gitignored
 * file the dev server reads — so running the checks locally needs no setup.
 */
export function cmsCredentials() {
  let username = process.env['CMS_ADMIN_USERNAME'];
  let password = process.env['CMS_ADMIN_PASSWORD'];

  if (!username || !password) {
    const envFile = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envFile)) {
      for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
        const match = /^\s*(CMS_ADMIN_USERNAME|CMS_ADMIN_PASSWORD)\s*=\s*(.*)\s*$/.exec(line);
        if (!match) continue;
        const value = match[2].replace(/^["']|["']$/g, '');
        if (match[1] === 'CMS_ADMIN_USERNAME') username ||= value;
        else password ||= value;
      }
    }
  }

  if (!username || !password) {
    console.error(
      'FAIL  CMS_ADMIN_USERNAME and CMS_ADMIN_PASSWORD are not set.\n' +
        '      Put them in .env.local (gitignored) or pass them in the environment.',
    );
    process.exit(1);
  }
  return { username, password };
}
