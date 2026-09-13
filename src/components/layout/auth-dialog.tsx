"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { WeizLogo } from "../weiz-logo";

export type AuthMode = "login" | "register";

/**
 * The two doors into the app, entirely inside a dialog over the landing page
 * (ADR-0044 in the app repo): sign in, and start a trial. Nobody sees
 * app.weiz.chat until they are signed in on it.
 *
 * ## How a session can start here at all
 *
 * The app's session cookie is `__Host-session` on app.weiz.chat, and nothing
 * on this origin can set it — Safari refuses third-party cookies outright.
 * So every step here calls the app's API with a short-lived bearer token
 * instead, and the last step asks the app for a one-time code and sends the
 * browser to /auth/handoff with it. That is a top-level navigation, first-
 * party, and the cookie sets. The token in this page's memory dies at that
 * door; the app rotates it away.
 *
 * ## Deliberately thin
 *
 * Every rule lives in the app: code expiry and attempt caps, the password
 * floor and blocklist, lockout, rate limits, uniform failures. This form
 * collects, sends, and shows the app's answer. It enforces nothing of its own
 * beyond "the two passwords match".
 *
 * ## A native <dialog>
 *
 * `showModal()` gives the focus trap, Escape, inertness of the page behind and
 * the `::backdrop` layer for free, with no library. Everything positional uses
 * logical properties, so Hebrew mirrors it without a second rule.
 */

type Stage =
  | "email" // both: the address
  | "password" // login: the password for it
  | "code" // both: the six digits from the inbox
  | "account" // register: name, business, password
  | "forgot-sent" // login: a reset link is on its way
  | "handing-off"; // the browser is leaving for the app

type ErrorKey =
  | "invalidCode"
  | "invalidCredentials"
  | "rateLimited"
  | "passwordTooWeak"
  | "passwordMismatch"
  | "error";

const BEARER_HEADER = { "x-session-transport": "bearer" } as const;

/** The app's API, as this dialog uses it. Never a cookie; a token when we have one. */
function api(appUrl: string, token: string | null) {
  return async function call(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
    options: { credentials?: RequestCredentials } = {},
  ): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
    const headers: Record<string, string> = { ...BEARER_HEADER };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(new URL(path, appUrl).toString(), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // "omit" by design: the session travels as a bearer token, never as a
      // cookie, on every call but one — see handOff.
      credentials: options.credentials ?? "omit",
    });
    let json: Record<string, unknown> = {};
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      /* no body, or not JSON — the status is the answer */
    }
    return { ok: res.ok, status: res.status, json };
  };
}

/** 0–3. Length carries the score; variety nudges it. Advisory, never a gate. */
function passwordScore(password: string): number {
  if (password.length < 8) return 0;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) =>
    re.test(password),
  ).length;
  let score = password.length >= 16 ? 3 : password.length >= 12 ? 2 : 1;
  if (classes >= 3 && score < 3) score += 1;
  if (password.length < 12 && score > 2) score = 2;
  return score;
}

export function AuthDialog({
  appUrl,
  mode,
  onClose,
}: {
  appUrl: string;
  /** Which door is open; null when closed. */
  mode: AuthMode | null;
  onClose: () => void;
}) {
  const t = useTranslations("nav.authDialog");
  const ref = useRef<HTMLDialogElement>(null);

  // The door that was last OPEN. While the card closes `mode` is already
  // null, and flipping the copy mid-close would be a visible flicker.
  const [shown, setShown] = useState<AuthMode>("login");
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [business, setBusiness] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [reveal, setReveal] = useState(false);

  // Switching doors resets the journey but keeps the typed address — the
  // one thing both doors ask for first.
  if (mode !== null && mode !== shown) {
    setShown(mode);
    setStage("email");
    setErrorKey(null);
    setPassword("");
    setConfirm("");
    setCode("");
  }

  const open = mode !== null;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const call = api(appUrl, token);

  function fail(
    status: number,
    on: "code" | "login" | "password" | "other",
  ): void {
    if (status === 429) setErrorKey("rateLimited");
    else if (status === 401 && on === "code") setErrorKey("invalidCode");
    else if (status === 401 && on === "login")
      setErrorKey("invalidCredentials");
    else if (status === 422 && on === "password")
      setErrorKey("passwordTooWeak");
    else setErrorKey("error");
  }

  async function run(work: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErrorKey(null);
    try {
      await work();
    } catch {
      setErrorKey("error");
    } finally {
      setBusy(false);
    }
  }

  /** The door itself: a one-time code, then the browser leaves for the app. */
  async function handOff(
    bearer: string,
    next: "app" | "onboarding",
  ): Promise<void> {
    // The handoff answer carries two halves: the code in the body, and a
    // marker cookie for app.weiz.chat that only THIS browser receives. The
    // navigation below sends the cookie back, which is what proves to the
    // app that the browser spending the code is the one that asked for it.
    // "include" is what lets the browser keep that cookie; www and app are
    // one site, so it is a first-party cookie, not a third-party one.
    const res = await api(appUrl, bearer)(
      "POST",
      `/api/v1/auth/handoff?next=${next}`,
      undefined,
      { credentials: "include" },
    );
    const url = res.json["handoff_url"];
    if (!res.ok || typeof url !== "string") {
      fail(res.status, "other");
      return;
    }
    setStage("handing-off");
    window.location.assign(url);
  }

  async function requestCode(): Promise<void> {
    const res = await call("POST", "/api/v1/auth/otp/request", {
      identifier: email,
    });
    if (!res.ok) {
      fail(res.status, "other");
      return;
    }
    setCode("");
    setStage("code");
  }

  async function verifyCode(): Promise<void> {
    const res = await call("POST", "/api/v1/auth/otp/verify", {
      identifier: email,
      code,
    });
    const bearer = res.json["session_token"];
    if (!res.ok || typeof bearer !== "string") {
      fail(res.status, "code");
      return;
    }
    setToken(bearer);
    if (shown === "login") {
      await handOff(bearer, "app");
      return;
    }
    // Sign-up: an address that already has a workspace is simply signed in —
    // the same thing the app does, and this page cannot tell the two apart
    // before the code is verified (§26).
    const me = await api(appUrl, bearer)("GET", "/api/v1/me");
    const memberships = me.json["memberships"];
    if (Array.isArray(memberships) && memberships.length > 0) {
      await handOff(bearer, "app");
      return;
    }
    setStage("account");
  }

  async function signInWithPassword(): Promise<void> {
    const res = await call("POST", "/api/v1/auth/password/login", {
      email,
      password,
    });
    const bearer = res.json["session_token"];
    if (!res.ok || typeof bearer !== "string") {
      fail(res.status, "login");
      return;
    }
    setToken(bearer);
    await handOff(bearer, "app");
  }

  async function forgotPassword(): Promise<void> {
    const res = await call("POST", "/api/v1/auth/password/forgot", { email });
    if (!res.ok) {
      fail(res.status, "other");
      return;
    }
    setStage("forgot-sent");
  }

  /** Name, password and workspace — after this the account is real. */
  async function createAccount(): Promise<void> {
    if (password !== confirm) {
      setErrorKey("passwordMismatch");
      return;
    }
    if (!token) {
      setErrorKey("error");
      return;
    }
    const named = await call("PATCH", "/api/v1/me", { full_name: fullName });
    if (!named.ok) {
      fail(named.status, "other");
      return;
    }
    const set = await call("POST", "/api/v1/auth/password/set", { password });
    if (!set.ok) {
      fail(set.status, "password");
      return;
    }
    // Creating the workspace rotates the session; the new token is the one
    // that hands off.
    const org = await call("POST", "/api/v1/orgs", { name: business });
    const rotated = org.json["session_token"];
    if (!org.ok || typeof rotated !== "string") {
      fail(org.status, "other");
      return;
    }
    setToken(rotated);
    await handOff(rotated, "onboarding");
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (busy) return;
    if (stage === "email") {
      if (shown === "login") {
        setErrorKey(null);
        setStage("password");
      } else void run(requestCode);
    } else if (stage === "password") void run(signInWithPassword);
    else if (stage === "code") void run(verifyCode);
    else if (stage === "account") void run(createAccount);
  }

  // Every way out goes through the element's own close(); its `close` event
  // is the one place the parent hears about it.
  function close() {
    ref.current?.close();
  }
  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close();
  }

  const door = shown === "login" ? "login" : "register";
  const field =
    "w-full rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-muted/70 focus:border-accent disabled:opacity-60";
  const primary =
    "mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-60";
  const link = "font-semibold text-accent hover:underline disabled:opacity-60";
  const label = "text-sm font-semibold text-fg";

  const strength = passwordScore(password);
  const strengthWord = [
    t("strength.weak"),
    t("strength.fair"),
    t("strength.good"),
    t("strength.strong"),
  ][strength];

  const passwordInput = (
    id: string,
    value: string,
    set: (v: string) => void,
    autoComplete: string,
    ariaLabel: string,
  ) => (
    <div className="relative">
      <input
        id={id}
        type={reveal ? "text" : "password"}
        autoComplete={autoComplete}
        dir="ltr"
        required
        minLength={id.endsWith("confirm") ? undefined : 8}
        value={value}
        disabled={busy}
        onChange={(event) => set(event.target.value)}
        className={`${field} pe-14`}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setReveal(!reveal)}
        aria-label={reveal ? t("hidePassword") : t("showPassword")}
        className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-fg"
      >
        {reveal ? t("hide") : t("show")}
      </button>
    </div>
  );

  let body: ReactNode;
  if (stage === "handing-off") {
    body = (
      <p className="mt-6 text-center text-sm text-muted" role="status">
        {t("handingOff")}
      </p>
    );
  } else if (stage === "forgot-sent") {
    body = (
      <>
        <p className="mt-6 text-sm text-fg" role="status">
          {t("login.resetSent")}
        </p>
        <button
          type="button"
          className={`${link} mt-4 text-sm`}
          onClick={() => setStage("password")}
        >
          {t("back")}
        </button>
      </>
    );
  } else {
    body = (
      <form onSubmit={submit} className="mt-6 flex flex-col gap-2">
        {stage === "email" ? (
          <>
            <label htmlFor="auth-dialog-email" className={label}>
              {t("emailLabel")}
            </label>
            <input
              id="auth-dialog-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              required
              autoFocus
              placeholder={t("emailPlaceholder")}
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              className={field}
            />
            <button type="submit" disabled={busy} className={primary}>
              {busy ? t("loading") : t("continue")}
            </button>
            {door === "register" ? (
              <p className="mt-1 text-center text-xs text-muted">
                {t("register.reassurance")}
              </p>
            ) : null}
          </>
        ) : null}

        {stage === "password" ? (
          <>
            <p className="text-sm text-muted">
              <span dir="ltr">{email}</span>{" "}
              <button
                type="button"
                className={link}
                disabled={busy}
                onClick={() => setStage("email")}
              >
                {t("change")}
              </button>
            </p>
            <label htmlFor="auth-dialog-password" className={label}>
              {t("login.passwordLabel")}
            </label>
            {passwordInput(
              "auth-dialog-password",
              password,
              setPassword,
              "current-password",
              t("login.passwordLabel"),
            )}
            <button type="submit" disabled={busy} className={primary}>
              {busy ? t("loading") : t("login.signIn")}
            </button>
            <p className="mt-2 text-center text-sm text-muted">
              <button
                type="button"
                className={link}
                disabled={busy}
                onClick={() => void run(requestCode)}
              >
                {t("login.useCodeInstead")}
              </button>
              {" · "}
              <button
                type="button"
                className={link}
                disabled={busy}
                onClick={() => void run(forgotPassword)}
              >
                {t("login.forgotPassword")}
              </button>
            </p>
          </>
        ) : null}

        {stage === "code" ? (
          <>
            <p className="text-sm text-muted">
              {t("codeSentTo")}{" "}
              <strong dir="ltr" className="text-fg">
                {email}
              </strong>
            </p>
            <label htmlFor="auth-dialog-code" className={label}>
              {t("codeLabel")}
            </label>
            <input
              id="auth-dialog-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              dir="ltr"
              required
              autoFocus
              value={code}
              disabled={busy}
              onChange={(event) => setCode(event.target.value)}
              className={`${field} tracking-[0.3em]`}
            />
            <p className="text-xs text-muted">{t("codeHint")}</p>
            <button type="submit" disabled={busy} className={primary}>
              {busy ? t("loading") : t("verify")}
            </button>
            <p className="mt-2 text-center text-sm text-muted">
              <button
                type="button"
                className={link}
                disabled={busy}
                onClick={() => void run(requestCode)}
              >
                {t("resend")}
              </button>
              {" · "}
              <button
                type="button"
                className={link}
                disabled={busy}
                onClick={() => setStage("email")}
              >
                {t("change")}
              </button>
            </p>
          </>
        ) : null}

        {stage === "account" ? (
          <>
            <p className="text-sm text-muted">{t("register.accountHint")}</p>
            <label htmlFor="auth-dialog-name" className={label}>
              {t("register.nameLabel")}
            </label>
            <input
              id="auth-dialog-name"
              type="text"
              autoComplete="name"
              required
              autoFocus
              value={fullName}
              disabled={busy}
              onChange={(event) => setFullName(event.target.value)}
              className={field}
            />
            <label htmlFor="auth-dialog-business" className={label}>
              {t("register.businessLabel")}
            </label>
            <input
              id="auth-dialog-business"
              type="text"
              autoComplete="organization"
              required
              value={business}
              disabled={busy}
              onChange={(event) => setBusiness(event.target.value)}
              className={field}
            />
            <label htmlFor="auth-dialog-new-password" className={label}>
              {t("register.passwordLabel")}
            </label>
            {passwordInput(
              "auth-dialog-new-password",
              password,
              setPassword,
              "new-password",
              t("register.passwordLabel"),
            )}
            {password !== "" ? (
              <div className="mt-1" aria-live="polite">
                <div
                  className="flex gap-1"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={3}
                  aria-valuenow={strength}
                  aria-label={t("strength.label")}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i <= strength
                          ? strength >= 3
                            ? "bg-ok"
                            : strength === 2
                              ? "bg-warn"
                              : "bg-danger"
                          : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted">
                  <span className="font-semibold text-fg">{strengthWord}</span>
                  {strength < 2 ? ` · ${t("strength.tip")}` : null}
                </p>
              </div>
            ) : null}
            <p className="text-xs text-muted">{t("register.passwordHint")}</p>
            <label htmlFor="auth-dialog-confirm" className={label}>
              {t("register.confirmLabel")}
            </label>
            {passwordInput(
              "auth-dialog-confirm",
              confirm,
              setConfirm,
              "new-password",
              t("register.confirmLabel"),
            )}
            <button type="submit" disabled={busy} className={primary}>
              {busy ? t("loading") : t("register.createAccount")}
            </button>
          </>
        ) : null}

        {errorKey ? (
          <p
            className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {t(`errors.${errorKey}`)}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={onBackdropClick}
      aria-labelledby="auth-dialog-title"
      className="m-auto w-[min(27rem,calc(100vw-2rem))] rounded-[22px] border-0 bg-surface p-0 text-fg shadow-[0_2px_6px_rgb(2_6_23/0.18),0_36px_80px_-24px_rgb(2_6_23/0.58)] backdrop:bg-[rgb(8_6_24/0.58)] backdrop:backdrop-blur-[4px]"
    >
      <div className="relative px-8 pb-6 pt-8">
        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          className="absolute end-4 top-4 grid size-8 place-items-center rounded-lg text-muted transition hover:bg-accent-soft/60 hover:text-fg"
        >
          <svg
            viewBox="0 0 20 20"
            width={18}
            height={18}
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M5.5 5.5l9 9M14.5 5.5l-9 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex justify-center">
          <WeizLogo width={132} />
        </div>

        <p className="mt-6 text-center text-2xl font-semibold leading-tight tracking-[-0.022em] text-muted/80">
          {t(`${door}.kicker`)}
        </p>
        <h2
          id="auth-dialog-title"
          className="mt-0.5 text-center text-2xl font-bold leading-tight tracking-[-0.022em] text-fg"
        >
          {stage === "account"
            ? t("register.accountTitle")
            : t(`${door}.title`)}
        </h2>

        {body}

        {stage === "email" || stage === "password" ? (
          <p className="mt-5 text-center text-sm text-muted">
            {door === "login" ? (
              <>
                {t("login.noAccount")}{" "}
                <a href={`${appUrl}/register`} className={link}>
                  {t("login.startTrial")}
                </a>
              </>
            ) : (
              <>
                {t("register.hasAccount")}{" "}
                <a href={`${appUrl}/login`} className={link}>
                  {t("register.logIn")}
                </a>
              </>
            )}
          </p>
        ) : null}
      </div>
    </dialog>
  );
}
