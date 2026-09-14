"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile for the landing-page dialog (app repo AUTH-001).
 *
 * Renders nothing unless NEXT_PUBLIC_TURNSTILE_SITE_ID is set at build time.
 * With a key, the widget reports a single-use token that the dialog sends
 * with the request it protects — asking for a sign-in code, creating the
 * workspace — and then remounts this component for a fresh one.
 */
declare global {
  interface Window {
    turnstile?: {
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ): string;
      remove(widgetId: string): void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined" || window.turnstile)
    return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export const TURNSTILE_SITE_KEY: string | null =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_ID || null;

export function TurnstileWidget({
  action,
  onToken,
}: {
  action?: string;
  onToken: (token: string | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  // The latest callback, read from the widget's own callbacks without
  // re-rendering the widget when the parent re-renders.
  const report = useRef(onToken);
  useEffect(() => {
    report.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !host.current) return;
    let widgetId: string | null = null;
    let cancelled = false;
    void loadTurnstile()
      .then(() => {
        if (cancelled || !host.current || !window.turnstile) return;
        widgetId = window.turnstile.render(host.current, {
          sitekey: TURNSTILE_SITE_KEY,
          ...(action ? { action } : {}),
          callback: (token) => report.current(token),
          "expired-callback": () => report.current(null),
          "error-callback": () => report.current(null),
        });
      })
      .catch(() => report.current(null));
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={host} className="my-1" />;
}
