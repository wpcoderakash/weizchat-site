import Image from 'next/image';

/**
 * The official WeizChat logo, used exactly as supplied.
 *
 * The artwork is a PNG whose background is baked in — an opaque near-black
 * (#0b0b0b), not transparency. So it is presented on a dark plate rather than
 * dropped onto whatever surface is behind it: on a light page a raw black
 * rectangle reads as a rendering fault, and keying the background out would be
 * modifying the mark, which we do not do. The plate makes the same file look
 * deliberate on light and dark alike.
 *
 * Intrinsic size is 912 x 514. Callers set a width; the height follows, so the
 * aspect ratio is never touched.
 */
export function WeizLogo({
  width = 140,
  priority = false,
  className,
}: {
  width?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span className={className ? `weiz-logo ${className}` : 'weiz-logo'}>
      <Image
        src="/brand/weizchat-logo.png"
        alt="WeizChat"
        width={width}
        height={Math.round((width * 514) / 912)}
        priority={priority}
        sizes={`${width}px`}
      />
    </span>
  );
}
