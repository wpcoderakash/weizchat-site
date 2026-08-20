/**
 * The Weiz W — exact paths and colours from the official logo. Identical
 * component to the product's, so the mark never drifts between weiz.chat
 * and app.weiz.chat.
 */
export function WeizMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 88 89" width={size} height={size} aria-hidden="true" focusable="false">
      <polygon fill="#460c91" points="14.89 20.48 0 20.22 12.66 59.84 25.55 36.81 14.89 20.48" />
      <polygon
        fill="#7f3dd3"
        points="87.11 0 51.21 69.89 38.7 51.33 1.38 88 37.45 22.15 49.88 38.11 87.11 0"
      />
    </svg>
  );
}
