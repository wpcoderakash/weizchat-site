import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';

/**
 * CMS authentication and roles.
 *
 * Two layers, deliberately:
 *
 *  1. The BOOTSTRAP account — `CMS_ADMIN_USERNAME` / `CMS_ADMIN_PASSWORD`
 *     from the environment. Always a super_admin, never stored, never
 *     suspendable. Its job is to make lock-out impossible: whatever
 *     happens to the users file, the owner can always sign in.
 *  2. STORED users in `content-store/users.json`, created from the admin,
 *     with scrypt-hashed passwords and one of three roles.
 *
 * Roles are a strict ladder:
 *   editor       → pages, posts, media
 *   admin        → + global content (nav, footer, site identity)
 *   super_admin  → + user management
 *
 * Sessions: an httpOnly cookie holding `username:token`, where the token
 * is derived from the user's password hash AND the bootstrap password as
 * a pepper. Changing a user's password — or the env password — signs the
 * affected sessions out. Every comparison is constant-time, and a wrong
 * username is indistinguishable from a wrong password.
 */

export type Role = 'editor' | 'admin' | 'super_admin';

const ROLE_RANK: Record<Role, number> = { editor: 0, admin: 1, super_admin: 2 };

export interface CmsUser {
  username: string;
  role: Role;
  status: 'active' | 'suspended';
  /** hex scrypt hash + salt. Absent on the bootstrap account. */
  hash?: string;
  salt?: string;
  createdAt?: string;
}

const COOKIE = 'weizchat_cms';
const USERS_FILE = path.join(process.cwd(), 'content-store', 'users.json');

function bootstrap(): { username: string; password: string } | null {
  const username = process.env.CMS_ADMIN_USERNAME;
  const password = process.env.CMS_ADMIN_PASSWORD;
  if (!username || username.length < 3 || !password || password.length < 8) return null;
  return { username, password };
}

export function adminConfigured(): boolean {
  return bootstrap() !== null;
}

function readUsers(): CmsUser[] {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    return Array.isArray(raw) ? (raw as CmsUser[]) : [];
  } catch {
    console.error('[cms] users.json unreadable — only the bootstrap account can sign in');
    return [];
  }
}

function writeUsers(users: CmsUser[]): void {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
}

function hashPassword(password: string, saltHex?: string): { hash: string; salt: string } {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return { hash: hash.toString('hex'), salt: salt.toString('hex') };
}

function same(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** The session token for a user — derived, never a stored secret. */
function tokenFor(username: string, secretMaterial: string): string {
  const pepper = bootstrap()?.password ?? '';
  return createHash('sha256').update(`weizchat-cms:${username}:${secretMaterial}:${pepper}`).digest('hex');
}

function secretMaterialFor(user: { username: string }): string | null {
  const boot = bootstrap();
  if (boot && same(user.username.toLowerCase(), boot.username.toLowerCase())) return boot.password;
  const stored = readUsers().find((u) => u.username.toLowerCase() === user.username.toLowerCase());
  return stored?.status === 'active' && stored.hash ? stored.hash : null;
}

export function checkCredentials(username: string, password: string): CmsUser | null {
  const boot = bootstrap();
  if (!boot) return null;
  const name = username.trim().toLowerCase();

  // The bootstrap account. Both fields always compared — no short-circuit,
  // or a valid username becomes measurably faster to probe.
  const bootUserOk = same(name, boot.username.toLowerCase());
  const bootPassOk = same(password, boot.password);
  if (bootUserOk && bootPassOk) {
    return { username: boot.username, role: 'super_admin', status: 'active' };
  }

  const stored = readUsers().find((u) => u.username.toLowerCase() === name);
  // Burn comparable work whether or not the user exists.
  const salt = stored?.salt ?? randomBytes(16).toString('hex');
  const attempt = hashPassword(password, salt).hash;
  const expected = stored?.hash ?? attempt.split('').reverse().join('');
  const passOk = same(attempt, expected);
  if (!stored || stored.status !== 'active' || !passOk) return null;
  return stored;
}

export function sessionCookieFor(user: CmsUser): { name: string; value: string } {
  const material = secretMaterialFor(user);
  return { name: COOKIE, value: `${user.username}:${tokenFor(user.username, material ?? '')}` };
}

/** The signed-in user, or null. Suspension takes effect on the next request. */
export async function currentUser(): Promise<CmsUser | null> {
  if (!adminConfigured()) return null;
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const sep = raw.lastIndexOf(':');
  if (sep <= 0) return null;
  const username = raw.slice(0, sep);
  const token = raw.slice(sep + 1);

  const material = secretMaterialFor({ username });
  if (!material) return null;
  const expected = tokenFor(username, material);
  const a = Buffer.from(token, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const boot = bootstrap();
  if (boot && same(username.toLowerCase(), boot.username.toLowerCase())) {
    return { username: boot.username, role: 'super_admin', status: 'active' };
  }
  return readUsers().find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function isSignedIn(): Promise<boolean> {
  return (await currentUser()) !== null;
}

export async function hasRole(min: Role): Promise<boolean> {
  const user = await currentUser();
  return user !== null && ROLE_RANK[user.role] >= ROLE_RANK[min];
}

// ── User management (super_admin only; enforced at the API) ─────────────────

export function listUsers(): Omit<CmsUser, 'hash' | 'salt'>[] {
  const boot = bootstrap();
  const stored = readUsers().map((u) => ({ username: u.username, role: u.role, status: u.status, createdAt: u.createdAt }));
  return [
    ...(boot
      ? [{ username: boot.username, role: 'super_admin' as Role, status: 'active' as const }]
      : []),
    ...stored,
  ];
}

export function upsertUser(input: {
  username: string;
  password?: string;
  role: Role;
  status: 'active' | 'suspended';
}): { ok: true } | { ok: false; error: string } {
  const name = input.username.trim().toLowerCase();
  const boot = bootstrap();
  if (boot && name === boot.username.toLowerCase()) {
    return { ok: false, error: 'bootstrap_account' };
  }
  if (name.length < 3) return { ok: false, error: 'username_too_short' };

  const users = readUsers();
  const existing = users.find((u) => u.username.toLowerCase() === name);
  if (!existing && (!input.password || input.password.length < 8)) {
    return { ok: false, error: 'password_too_short' };
  }
  if (input.password && input.password.length < 8) {
    return { ok: false, error: 'password_too_short' };
  }

  const credentials = input.password ? hashPassword(input.password) : null;
  if (existing) {
    existing.role = input.role;
    existing.status = input.status;
    if (credentials) {
      existing.hash = credentials.hash;
      existing.salt = credentials.salt;
    }
  } else {
    users.push({
      username: name,
      role: input.role,
      status: input.status,
      hash: credentials!.hash,
      salt: credentials!.salt,
      createdAt: new Date().toISOString(),
    });
  }
  writeUsers(users);
  return { ok: true };
}

export function removeUser(username: string): boolean {
  const name = username.trim().toLowerCase();
  const boot = bootstrap();
  if (boot && name === boot.username.toLowerCase()) return false;
  const users = readUsers();
  const next = users.filter((u) => u.username.toLowerCase() !== name);
  if (next.length === users.length) return false;
  writeUsers(next);
  return true;
}

export const CMS_COOKIE = COOKIE;
