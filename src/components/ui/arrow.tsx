/**
 * The forward arrow of the design system. Mirrors under `rtl` — "forward"
 * points the way the text runs in both scripts — and nudges on hover of any
 * `.btn`, `.link-arrow` or `.card-hover` around it (globals.css).
 */
export function Arrow({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className="arrow shrink-0 rtl:-scale-x-100"
    >
      <path
        d="M3 8h10m-4-4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
