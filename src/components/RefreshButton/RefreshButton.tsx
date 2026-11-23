'use client';

import { useMenuOpen } from '@/lib/menu';
import { LOADER_KEY } from '@/components/Loader/keys';
import s from './RefreshButton.module.css';

/**
 * Review helper from the prototype: restarts the site from scratch on Home with the loader.
 * Clears the "loader seen" flag for this session and does a full reload, so everything
 * (loader, hero intro, slider) plays exactly as on a first visit.
 */
export default function RefreshButton() {
  const menuOpen = useMenuOpen();
  if (menuOpen) return null;
  return (
    <button
      type="button"
      className={s.rf}
      aria-label="Refresh: replay the loader and return to Home"
      onClick={() => {
        try {
          sessionStorage.removeItem(LOADER_KEY);
        } catch {}
        window.scrollTo(0, 0);
        // a full reload on purpose: a client-side navigation would not replay the first-visit boot
        window.history.replaceState(null, '', '/');
        window.location.reload();
      }}
    >
      Refresh
    </button>
  );
}
