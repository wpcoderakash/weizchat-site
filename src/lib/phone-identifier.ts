/**
 * "An email or a WhatsApp number" in ONE field (app ADR-0072).
 *
 * A number written the way its owner writes it — `0544747742`, `01740021602` —
 * names no country, so it is only a number once a country is attached. The
 * dialog shows a country picker exactly then, and what it SENDS is always the
 * full international number: the app is never asked to guess a country.
 *
 * The algorithm mirrors the app's `identifierShape` / `resolveIdentifier` /
 * `toE164` (`packages/core/src/phone-countries.ts`), which carry the tests.
 * The TABLES are not copied here at all: they arrive from the app's
 * `GET /api/v1/auth/methods`, their one home.
 */
export interface PhoneTables {
  /** ISO alpha-2 → calling code, e.g. `{ IL: "972", BD: "880" }`. */
  dial_codes: Record<string, string>;
  /** Countries whose numbers keep the leading zero (Italy). */
  keeps_trunk_zero: string[];
  /** IANA zone → ISO alpha-2, to open the picker somewhere plausible. */
  zone_country: Record<string, string>;
  default_country: string;
}

export type IdentifierShape = "empty" | "email" | "international" | "national";

const E164 = /^\+[1-9][0-9]{6,14}$/;

export function identifierShape(raw: string): IdentifierShape {
  const text = raw.trim();
  if (text === "") return "empty";
  if (text.includes("@") || /[a-z]/i.test(text)) return "email";
  if (text.startsWith("+") || text.startsWith("00")) return "international";
  return /^[0-9(]/.test(text) ? "national" : "email";
}

/** The email as typed, or the number in E.164; null while it is not dialable. */
export function resolveIdentifier(
  raw: string,
  country: string,
  tables: PhoneTables | null,
): string | null {
  const shape = identifierShape(raw);
  if (shape === "empty") return null;
  if (shape === "email") return raw.trim();

  const text = raw.trim();
  if (shape === "international") {
    // Decided from the ORIGINAL text, never from whether the digits happen to
    // begin with a calling code (an Italian mobile starts 39x inside +39).
    let digits = text.replace(/[^0-9]/g, "");
    if (text.startsWith("00")) digits = digits.slice(2);
    const full = `+${digits}`;
    return E164.test(full) ? full : null;
  }

  const dial = tables?.dial_codes[country];
  if (dial === undefined) return null;
  let digits = text.replace(/[^0-9]/g, "");
  if (!tables?.keeps_trunk_zero.includes(country)) digits = digits.replace(/^0+/, "");
  if (digits === "") return null;
  const full = `+${dial}${digits}`;
  return E164.test(full) ? full : null;
}

export function guessCountry(tables: PhoneTables | null): string {
  const fallback = tables?.default_country ?? "IL";
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tables?.zone_country[zone] ?? fallback;
  } catch {
    return fallback;
  }
}

/** Narrowing for a JSON body of unknown shape; anything odd means "no tables". */
export function readPhoneTables(value: unknown): PhoneTables | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const isStringMap = (m: unknown): m is Record<string, string> =>
    typeof m === "object" && m !== null && Object.values(m).every((x) => typeof x === "string");
  if (!isStringMap(v["dial_codes"]) || !isStringMap(v["zone_country"])) return null;
  const keeps = v["keeps_trunk_zero"];
  if (!Array.isArray(keeps) || !keeps.every((x) => typeof x === "string")) return null;
  if (typeof v["default_country"] !== "string") return null;
  return {
    dial_codes: v["dial_codes"],
    zone_country: v["zone_country"],
    keeps_trunk_zero: keeps,
    default_country: v["default_country"],
  };
}
