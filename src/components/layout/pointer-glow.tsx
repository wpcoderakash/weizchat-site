'use client';

import { useEffect } from 'react';

/**
 * The cursor spotlight on `.card-hover` (design system, globals.css): tells
 * the card under the pointer where the pointer is, as `--mx` / `--my`, and
 * CSS paints a soft accent light there.
 *
 * One listener for the whole site, at most one write per frame. Only for a
 * precise pointer that can hover (a mouse or trackpad — a finger has nothing
 * to follow) and only when motion is on (`data-motion`, set by the boot
 * script: never under reduced motion).
 */
export function PointerGlow() {
  useEffect(() => {
    if (!('motion' in document.documentElement.dataset)) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let frame = 0;
    let last: PointerEvent | null = null;

    function paint() {
      frame = 0;
      const event = last;
      if (!event || !(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>('.card-hover');
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - box.left}px`);
      card.style.setProperty('--my', `${event.clientY - box.top}px`);
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return;
      last = event;
      if (!frame) frame = requestAnimationFrame(paint);
    }

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
