/**
 * Template structure checks.
 *
 * The brief is explicit: implement ONLY rules that can be cited from Meta's
 * public documentation, and say "not checked" rather than guessing. So this
 * file implements the four rules stated on Meta's Message Templates guide
 * (developers.facebook.com/docs/whatsapp/business-management-api/
 * message-templates) and nothing else. Character limits for body/header/
 * footer/buttons and button counts are NOT documented on that page, so the
 * UI lists them as "not checked" instead of inventing thresholds.
 *
 * Everything runs locally; no template text is transmitted anywhere.
 */

export type Severity = 'error' | 'ok';

export interface CheckResult {
  /** messages key under `tools.templateChecker.checks.` */
  id: string;
  severity: Severity;
  /** Optional detail rendered verbatim (offending value). */
  detail?: string;
}

const NAME_PATTERN = /^[a-z0-9_]+$/;
const NAME_MAX = 512;
const POSITIONAL = /\{\{\s*(\d+)\s*\}\}/g;
const NAMED = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function checkTemplate(name: string, body: string): CheckResult[] {
  const results: CheckResult[] = [];

  // 1. Name characters — "lowercase alphanumeric characters and underscores".
  if (name.trim().length === 0) {
    results.push({ id: 'nameEmpty', severity: 'error' });
  } else if (!NAME_PATTERN.test(name)) {
    results.push({ id: 'nameChars', severity: 'error', detail: name });
  } else {
    results.push({ id: 'nameChars', severity: 'ok' });
  }

  // 2. Name length — max 512 characters.
  results.push(
    name.length > NAME_MAX
      ? { id: 'nameLength', severity: 'error', detail: String(name.length) }
      : { id: 'nameLength', severity: 'ok' },
  );

  const positional = [...body.matchAll(POSITIONAL)].map((m) => Number(m[1]));
  const allBraced = [...body.matchAll(NAMED)].map((m) => m[1] as string);
  const named = allBraced.filter((v) => !/^\d+$/.test(v));

  // 3. Formats must not be mixed — a template uses positional OR named.
  if (positional.length > 0 && named.length > 0) {
    results.push({ id: 'mixedFormats', severity: 'error' });
  } else {
    results.push({ id: 'mixedFormats', severity: 'ok' });
  }

  // 4a. Positional placeholders must run 1..n in order, with no gaps.
  if (positional.length > 0) {
    const expected = positional.map((_, i) => i + 1);
    const sequential = positional.every((value, i) => value === expected[i]);
    results.push(
      sequential
        ? { id: 'sequential', severity: 'ok' }
        : { id: 'sequential', severity: 'error', detail: positional.join(', ') },
    );
  }

  // 4b. Named placeholders: lowercase + underscores, and unique.
  if (named.length > 0) {
    const badly = named.filter((v) => !/^[a-z_][a-z0-9_]*$/.test(v));
    results.push(
      badly.length === 0
        ? { id: 'namedChars', severity: 'ok' }
        : { id: 'namedChars', severity: 'error', detail: badly.join(', ') },
    );

    const seen = new Set<string>();
    const dupes = named.filter((v) => (seen.has(v) ? true : (seen.add(v), false)));
    results.push(
      dupes.length === 0
        ? { id: 'namedUnique', severity: 'ok' }
        : { id: 'namedUnique', severity: 'error', detail: [...new Set(dupes)].join(', ') },
    );
  }

  return results;
}

/** Rules this tool deliberately does NOT check — shown to the user by name. */
export const notChecked = [
  'lengths',
  'buttons',
  'category',
  'policy',
  'variableEdges',
  'media',
] as const;
