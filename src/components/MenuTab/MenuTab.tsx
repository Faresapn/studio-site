'use client';

import { useEffect, useRef, useState } from 'react';
import { setMenuOpen, useMenuOpen } from '@/lib/menu';
import s from './MenuTab.module.css';

/** Small tab on the left edge. Steps aside while the page scrolls and returns 650 ms after it stops. */
export default function MenuTab() {
  const [away, setAway] = useState(false);
  const open = useMenuOpen();
  const timer = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      setAway(true);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setAway(false), 650);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={`${s.tab} ${away ? s.away : ''}`}
      aria-label="Open menu"
      aria-expanded={open}
      aria-controls="menu"
      onClick={() => setMenuOpen(true)}
    >
      <i />
      <i />
    </button>
  );
}
