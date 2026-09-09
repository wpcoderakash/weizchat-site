/**
 * The reveal toggle's glyph.
 *
 * `off` draws the struck-through eye, which is what the control shows while
 * the password is visible — the icon says what the next press does, not what
 * the field is currently doing. Both states carry the same optical weight so
 * the button does not appear to jump when it flips.
 */
export function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.4 8S3.9 3.6 8 3.6 14.6 8 14.6 8 12.1 12.4 8 12.4 1.4 8 1.4 8Z" />
      <circle cx="8" cy="8" r="2.05" />
      {off ? <path d="M2.9 13.1 13.1 2.9" /> : null}
    </svg>
  );
}
