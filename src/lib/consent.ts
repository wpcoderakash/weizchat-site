/**
 * Consent gate (brief 0.5.5): non-essential scripts are BLOCKED until the
 * visitor opts in. There are currently no analytics on this site at all —
 * this module exists so that any future tracking has exactly one lawful
 * entry point: `hasAnalyticsConsent()` must be checked before loading it.
 */
export const CONSENT_KEY = 'weizchat-consent';

export type ConsentChoice = 'accepted' | 'declined';

export function readConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(CONSENT_KEY);
  return raw === 'accepted' || raw === 'declined' ? raw : null;
}

export function writeConsent(choice: ConsentChoice): void {
  window.localStorage.setItem(CONSENT_KEY, choice);
}

export function hasAnalyticsConsent(): boolean {
  return readConsent() === 'accepted';
}
