'use client';

import { useEffect, useRef, type RefObject } from 'react';

type Options = {
  /** 1 = swiped left (go forward), -1 = swiped right (go back). */
  onSwipe: (dir: 1 | -1) => void;
  /** Live drag offset in px while dragging; called with 0 and `done` on release. */
  onDrag?: (dx: number, done?: boolean) => void;
};

/**
 * Horizontal swipe and mouse drag on `ref`. Vertical movement is left to the page (pair with
 * `touch-action: pan-y`), elements inside `[data-no-swipe]` are ignored, and the click that ends a
 * drag is swallowed so a swipe across a linked slide never opens it.
 */
export function useSwipe(ref: RefObject<HTMLElement | null>, { onSwipe, onDrag }: Options) {
  const cb = useRef({ onSwipe, onDrag });
  useEffect(() => {
    cb.current = { onSwipe, onDrag };
  }, [onSwipe, onDrag]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let id = -1;
    let x0 = 0;
    let y0 = 0;
    let t0 = 0;
    let dx = 0;
    let dragging = false;
    let swallow = false;

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest('[data-no-swipe]')) return;
      id = e.pointerId;
      x0 = e.clientX;
      y0 = e.clientY;
      t0 = performance.now();
      dx = 0;
      dragging = false;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (!dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          id = -1; // a vertical scroll, not ours
          return;
        }
        if (Math.abs(dx) < 10) return;
        dragging = true;
        el.setPointerCapture(id);
      }
      cb.current.onDrag?.(dx);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      if (!dragging) return;
      dragging = false;
      swallow = true;
      window.setTimeout(() => (swallow = false), 0);
      const v = Math.abs(dx) / Math.max(1, performance.now() - t0); // px per ms
      cb.current.onDrag?.(0, true);
      if (e.type === 'pointerup' && (Math.abs(dx) > 70 || (Math.abs(dx) > 24 && v > 0.45))) {
        cb.current.onSwipe(dx < 0 ? 1 : -1);
      }
    };
    const click = (e: MouseEvent) => {
      if (!swallow) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const noDrag = (e: DragEvent) => e.preventDefault();

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    el.addEventListener('dragstart', noDrag);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
      el.removeEventListener('dragstart', noDrag);
    };
  }, [ref]);
}
