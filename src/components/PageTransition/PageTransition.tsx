'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { connect, handlePop, pathChanged, ready } from '@/lib/transition';
import { setMenuOpen } from '@/lib/menu';
import { pageName } from '@/content/site';
import TransitOverlay from './TransitOverlay';

/**
 * Provider: owns the <main> wrapper that fades between routes, the transit overlay and the
 * screen-reader announcement, and hands them to the transition controller.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const [transit, setTransit] = useState<{ on: boolean; label: string }>({ on: false, label: '' });
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!mainRef.current) return;
    connect({
      router,
      main: mainRef.current,
      showTransit: (label) => setTransit({ on: true, label }),
      hideTransit: () => setTransit((t) => ({ ...t, on: false })),
      closeMenu: () => setMenuOpen(false),
      announce: (label) => setAnnouncement(`${label} page`),
      pageName,
    });
    // The loader (home, first visit) calls ready() itself when it finishes.
    if (!document.documentElement.classList.contains('loading')) ready();
    const onPop = () => void handlePop();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [router]);

  useEffect(() => {
    pathChanged(pathname);
  }, [pathname]);

  return (
    <>
      <main id="main" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <TransitOverlay on={transit.on} label={transit.label} />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}
