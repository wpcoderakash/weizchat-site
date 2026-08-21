/**
 * Shared WhatsApp link helpers for the free tools (brief §4).
 * Everything here is pure and runs in the browser — the tools never send a
 * phone number anywhere.
 */

/** Digits only, leading zeros of a local trunk prefix left to the caller. */
export function normalisePhone(input: string): string {
  return input.replace(/[^\d]/g, '');
}

export interface PhoneCheck {
  digits: string;
  /** E.164 allows at most 15 digits including country code. */
  valid: boolean;
  reason: 'empty' | 'too-short' | 'too-long' | 'leading-zero' | null;
}

export function checkPhone(input: string): PhoneCheck {
  const digits = normalisePhone(input);
  if (digits.length === 0) return { digits, valid: false, reason: 'empty' };
  // wa.me needs the full international number with no leading zero.
  if (digits.startsWith('0')) return { digits, valid: false, reason: 'leading-zero' };
  if (digits.length < 8) return { digits, valid: false, reason: 'too-short' };
  if (digits.length > 15) return { digits, valid: false, reason: 'too-long' };
  return { digits, valid: true, reason: null };
}

/** The official click-to-chat format: https://wa.me/<number>?text=<encoded>. */
export function waLink(phoneDigits: string, message: string): string {
  const base = `https://wa.me/${phoneDigits}`;
  return message.trim() ? `${base}?text=${encodeURIComponent(message)}` : base;
}
