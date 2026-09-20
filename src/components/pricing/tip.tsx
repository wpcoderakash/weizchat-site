'use client';

import { useId, useState } from 'react';

/**
 * A small "what does this mean" tooltip.
 *
 * It is a real button, not a hover target: it takes focus, so it works from
 * the keyboard and on touch (a tap focuses it). WCAG 1.4.13 asks three things
 * of content that appears on hover or focus, and each is handled:
 *   dismissible — Escape hides it without moving focus;
 *   hoverable   — the bubble sits inside the hover group, so moving the
 *                 pointer onto it keeps it open;
 *   persistent  — it stays until the pointer or focus leaves.
 *
 * Anchored to the INLINE-START edge and growing toward the end, with logical
 * properties, so it opens into the page in both LTR and RTL — a bubble centred
 * on a control near the edge of a phone screen is a bubble cut in half.
 */
export function Tip({ label, text }: { label: string; text: string }) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);

  return (
    <span
      // Below `md` the wrapper is NOT the anchor: the comparison table pins its
      // row headers there (position: sticky, which is a positioned box), so the
      // bubble anchors to the pinned cell and is inset to fit INSIDE it. Anchored
      // to the button, a 16rem bubble ran past the pinned column and was cut off
      // by the table's scroll container.
      className="group relative inline-flex align-middle max-md:static"
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setDismissed(true);
        }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border-strong text-[11px] font-semibold leading-none text-muted hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">i</span>
      </button>
      <span
        role="tooltip"
        id={id}
        // `hidden`, not `invisible`: an invisible absolutely-positioned bubble
        // still adds to a scroll container's overflow, and the comparison table
        // scrolls sideways on a phone. `aria-describedby` reads hidden content.
        className={`absolute start-0 top-full z-20 mt-2 w-64 max-w-[70vw] max-md:start-2 max-md:end-2 max-md:mt-0 max-md:w-auto max-md:max-w-none rounded-card border border-border bg-surface p-3 text-start text-sm font-normal leading-snug text-fg shadow-lg ${
          dismissed ? 'hidden' : 'hidden group-focus-within:block group-hover:block'
        }`}
      >
        {text}
      </span>
    </span>
  );
}
