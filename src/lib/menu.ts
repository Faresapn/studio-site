'use client';

import { useSyncExternalStore } from 'react';

/** Open/closed state of the full-screen menu, shared by the tab, the menu and the transition controller. */
let open = false;
const subs = new Set<() => void>();

export function setMenuOpen(next: boolean) {
  if (open === next) return;
  open = next;
  subs.forEach((s) => s());
}

export function useMenuOpen() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => open,
    () => false,
  );
}
