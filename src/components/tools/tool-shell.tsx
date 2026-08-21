'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/** Shared field styling so the five tools look like one family. */
export const fieldClass =
  'mt-1 w-full rounded-xl border border-border-strong bg-bg px-4 py-2.5 focus:border-accent';

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Copy-to-clipboard button with a real confirmation. Falls back to selecting
 * nothing silently — if the clipboard API is unavailable it says so rather
 * than pretending the copy worked.
 */
export function CopyButton({ value, className }: { value: string; className?: string }) {
  const t = useTranslations('tools.common');
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 2500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        'rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover'
      }
    >
      {state === 'copied' ? t('copied') : state === 'failed' ? t('copyFailed') : t('copy')}
    </button>
  );
}

/** A read-only result surface: monospace, selectable, wraps long values. */
export function ResultBox({ value, ariaLabel }: { value: string; ariaLabel: string }) {
  return (
    <output
      aria-label={ariaLabel}
      className="block w-full overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-sm"
      dir="ltr"
    >
      {value}
    </output>
  );
}
