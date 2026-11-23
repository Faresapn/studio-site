'use client';

import type Lenis from 'lenis';

/**
 * The single Lenis instance (null on touch screens and with reduced motion, where scrolling stays native).
 * Kept in a module so the transition controller and the menu can stop/start it without React plumbing.
 */
let lenis: Lenis | null = null;
const locks = new Set<string>();

export const setLenis = (l: Lenis | null) => {
  lenis = l;
};
export const getLenis = () => lenis;

/** Jump to a position immediately, keeping Lenis and the window in sync. */
export function scrollToInstant(y: number) {
  window.scrollTo(0, y);
  lenis?.scrollTo(y, { immediate: true, force: true });
}

/** Named scroll locks (menu, lightbox, loader). Scrolling resumes once every lock is released. */
export function lockScroll(name: string, on: boolean) {
  if (on) locks.add(name);
  else locks.delete(name);
  const locked = locks.size > 0;
  document.documentElement.style.overflow = locked ? 'hidden' : '';
  if (locked) lenis?.stop();
  else lenis?.start();
}
