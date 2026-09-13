"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { WeizLogo } from "../weiz-logo";

export type AuthMode = "login" | "register";

/**
 * The two doors into the app, opened over the landing page: sign in, and
 * start a trial. One card, two sets of words.
 *
 * ## Why it takes an address and not a password
 *
 * The app's session cookie is `__Host-session` on app.weiz.chat. A password
 * posted from this origin could never set it: Safari refuses third-party
 * cookies on cross-site requests and iframes outright, and Chrome is going the
 * same way. So this dialog does what the reference it is modelled on does —
 * collects the address, then continues to the app, where the same card takes
 * the password (or sends the sign-up code) with the address already filled
 * in. To the visitor it is one flow. The same is true of registration: the
 * code, the password and the workspace are all created on the app host.
 *
 * ## A native <dialog>
 *
 * `showModal()` gives the focus trap, Escape, inertness of the page behind and
 * the `::backdrop` layer for free, with no library. Everything positional uses
 * logical properties, so Hebrew mirrors it without a second rule.
 *
 * ## The footer links switch doors
 *
 * "Start your free trial" under sign-in and "Log in" under registration are
 * ordinary links to the app. The nav intercepts every plain click on a link
 * to the app's /login or /register and opens this dialog instead, so those
 * links simply switch the mode — and still work as links with JavaScript off
 * or from a middle-click.
 */
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
  const tLogin = useTranslations("nav.loginDialog");
  const tRegister = useTranslations("nav.registerDialog");
  const ref = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");

  // The words shown are the door that was last OPEN. While the card closes
  // `mode` is already null, and flipping the copy to a default door mid-close
  // would be a visible flicker — so the last real mode is kept.
  const [shown, setShown] = useState<AuthMode>("login");
  if (mode !== null && mode !== shown) setShown(mode);

  const open = mode !== null;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const t = shown === "login" ? tLogin : tRegister;
  const path = shown === "login" ? "/login" : "/register";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = new URL(path, appUrl);
    target.searchParams.set("identifier", email.trim());
    window.location.assign(target.toString());
  }

  // Every way out — the X, the backdrop, Escape, or `mode` going null — goes
  // through the element's own close(). Its `close` event is then the one place
  // the parent hears about it, so the history bookkeeping runs exactly once.
  function close() {
    ref.current?.close();
  }

  // A click on the backdrop lands on the <dialog> element itself, not on the
  // card inside it — which is the one click that should close it.
  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close();
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

        <WeizLogo width={132} />

        <p className="mt-6 text-2xl font-semibold leading-tight tracking-[-0.022em] text-muted/80">
          {t("kicker")}
        </p>
        <h2
          id="auth-dialog-title"
          className="mt-0.5 text-2xl font-bold leading-tight tracking-[-0.022em] text-fg"
        >
          {t("title")}
        </h2>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-2">
          <label
            htmlFor="auth-dialog-email"
            className="text-sm font-semibold text-fg"
          >
            {t("emailLabel")}
          </label>
          <input
            id="auth-dialog-email"
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            required
            autoFocus
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 text-base text-fg outline-none placeholder:text-muted/70 focus:border-accent"
          />
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            {t("continue")}
          </button>
          {shown === "register" ? (
            <p className="mt-1 text-center text-xs text-muted">
              {tRegister("reassurance")}
            </p>
          ) : null}
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {shown === "login" ? (
            <>
              {tLogin("noAccount")}{" "}
              <a
                href={`${appUrl}/register`}
                className="font-semibold text-accent hover:underline"
              >
                {tLogin("startTrial")}
              </a>
            </>
          ) : (
            <>
              {tRegister("hasAccount")}{" "}
              <a
                href={`${appUrl}/login`}
                className="font-semibold text-accent hover:underline"
              >
                {tRegister("logIn")}
              </a>
            </>
          )}
        </p>
      </div>
    </dialog>
  );
}
