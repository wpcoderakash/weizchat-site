import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  changeOwnPassword,
  currentUser,
  sessionCookieFor,
  MIN_PASSWORD_LENGTH,
} from '../../../../cms/auth';

/**
 * Changing your own password.
 *
 * Any signed-in role may change their own — it is their account. What it is
 * NOT is a way to change somebody else's: there is no username in the body,
 * only the session's own identity.
 */

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

const MESSAGES: Record<string, string> = {
  too_short: `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  unchanged: 'That is the password you already have.',
  illegal_characters: 'The password cannot contain a single quote or a line break.',
  current_password_wrong: 'Your current password was not accepted.',
  not_found: 'This account no longer exists.',
  env_file_unknown:
    'This account’s password lives in the server’s environment file, and the app has not been told where that is (WEIZ_ENV_FILE). Set it and restart.',
  env_write_failed:
    'The password could not be written to the server’s environment file. Check the logs and the file permissions.',
};

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { error: 'invalid', message: MESSAGES['too_short'] },
      { status: 400 },
    );
  }

  const result = await changeOwnPassword(
    user.username,
    body.data.currentPassword,
    body.data.newPassword,
  );
  if (!result.ok) {
    // A wrong current password is the user's mistake; the rest are the
    // server's. Both get the same shape, with a message worth reading.
    const status = result.error === 'current_password_wrong' ? 401 : 400;
    return NextResponse.json(
      { error: result.error, message: MESSAGES[result.error] ?? 'The password could not be changed.' },
      { status },
    );
  }

  // `changeOwnPassword` revokes every session for this account, deliberately:
  // a password change answers a suspected compromise, so any other device
  // holding a cookie is signed out. That includes the browser making this
  // request, hence the re-issue — otherwise changing your password would sign
  // you out of the page you are standing on. (Before AUTH-008 that revocation
  // was a side effect of deriving the token from the password; it is explicit
  // now, and this re-issue is what keeps the behaviour identical.)
  const cookie = sessionCookieFor(user);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}
