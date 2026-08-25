import Image from 'next/image';

/**
 * The official WeizChat logo.
 *
 * Two files, one lockup. The supplied artwork letters the name in white,
 * which is right on a dark surface and invisible on a pale one — so the light
 * variant inks that same lettering in the logo's own near-black. The purples
 * are the identity and are identical in both, as is every shape: the variant
 * shares the original's alpha channel exactly.
 *
 * Both are shipped and CSS chooses; no JavaScript, so the correct one is in
 * the first paint rather than swapping after hydration.
 *
 * Intrinsic size is 912 x 514. Callers give a width and the height follows,
 * so the aspect ratio is never touched.
 */
export function WeizLogo({
  width = 132,
  priority = false,
  className,
}: {
  width?: number;
  priority?: boolean;
  className?: string;
}) {
  const height = Math.round((width * 514) / 912);
  return (
    <span className={className ? `weiz-logo ${className}` : 'weiz-logo'}>
      <Image
        className="weiz-logo-dark"
        src="/brand/weizchat-logo.png"
        alt="WeizChat"
        width={width}
        height={height}
        priority={priority}
        sizes={`${width}px`}
      />
      <Image
        className="weiz-logo-light"
        src="/brand/weizchat-logo-light.png"
        alt=""
        aria-hidden
        width={width}
        height={height}
        priority={priority}
        sizes={`${width}px`}
      />
    </span>
  );
}
