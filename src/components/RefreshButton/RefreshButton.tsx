'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMenuOpen } from '@/lib/menu';
import { replayLoader } from '@/lib/replay';
import s from './RefreshButton.module.css';

/**
 * Review helper from the prototype: replays the loader (the house photos wiping up one after another,
 * the count, the frame opening into the hero) and returns to Home, without reloading the page.
 * The photos are already cached, so the sequence plays exactly as designed.
 */
export default function RefreshButton() {
  const menuOpen = useMenuOpen();
  const pathname = usePathname();
  const router = useRouter();
  if (menuOpen) return null;
  return (
    <button
      type="button"
      className={s.rf}
      aria-label="Refresh: replay the loader and return to Home"
      onClick={() => {
        replayLoader();
        // Home swaps in underneath the loader, so the frame opens straight into its hero
        if (pathname !== '/') router.push('/', { scroll: false });
      }}
    >
      Refresh
    </button>
  );
}
