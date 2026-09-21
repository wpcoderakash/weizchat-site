/**
 * A password the dialog can suggest (app ADR-0014, registration).
 *
 * Made IN THE BROWSER from the platform's cryptographic random source and put
 * in the same field a typed one would be; it reaches the app only as the
 * password the person submits. Nothing here sends, stores or logs it.
 *
 * Mirrors the app's `packages/core/src/generate-password.ts`, which carries the
 * tests (exact byte→character mapping, no modulo bias, the refusal to hand back
 * something weak). Keep the two alphabets identical.
 *
 * 64 characters → one random byte masked to six bits picks one with no bias; 16
 * of them carry 96 bits. No look-alikes (0/O, 1/l/I), and no bracket or quote:
 * those mirror or re-order inside a right-to-left form.
 */
const ALPHABET =
  "abcdefghijkmnpqrstuvwxyz" + "ABCDEFGHJKLMNPQRSTUVWXYZ" + "23456789" + "-_.#%+=@";

export const GENERATED_PASSWORD_LENGTH = 16;

/** Throws where there is no cryptographic source — the caller then offers nothing. */
export function generatePassword(): string {
  if (ALPHABET.length !== 64) throw new Error("the alphabet must stay 64 characters");
  for (let attempt = 0; attempt < 100; attempt++) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(GENERATED_PASSWORD_LENGTH));
    let out = "";
    for (const byte of bytes) out += ALPHABET[byte & 63];
    // Thrown back without a lowercase, an uppercase and a digit, so the
    // suggestion never reads as "fair" on the strength meter beside it.
    if (/[a-z]/.test(out) && /[A-Z]/.test(out) && /[0-9]/.test(out)) return out;
  }
  throw new Error("no usable random source");
}
