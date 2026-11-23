'use client';

import { useSyncExternalStore } from 'react';
import { setMenuOpen } from './menu';
import { scrollToInstant } from './scroll';
import { reboot } from './transition';
import { prefersReducedMotion } from './motion';

/**
 * Loader replay (the review "Refresh" button, as in the prototype).
 * Each replay bumps a counter; the client shell uses it as a React key so the loader restarts its
 * CSS sequence and the page remounts, which makes the hero intro and slider start over too.
 */
let count = 0;
const subs = new Set<() => void>();

export function useReplayCount() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => count,
    () => 0,
  );
}

export function replayLoader() {
  setMenuOpen(false);
  // no loader with reduced motion (as on a first visit): just back to the top of Home
  if (prefersReducedMotion()) return scrollToInstant(0);
  reboot(); // cancel any transition in flight; the page waits for the loader again
  document.documentElement.classList.add('loading'); // shows the loader before React re-renders
  scrollToInstant(0);
  count += 1;
  subs.forEach((s) => s());
}
