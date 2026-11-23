'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, initGsap } from '@/lib/motion';
import { onPageEnter } from '@/lib/transition';

const DURATION = 6500; // ms per slide
const BAR_GAP = 420; // the bar waits this long (hidden) before refilling, as in the prototype

type Options = {
  count: number;
  onChange?: (from: number, to: number) => void;
};

/**
 * Timing for the home hero: 6.5 s per slide, a progress bar that fills over that time,
 * pausing whenever the hero is off-screen, the tab is hidden or the page has not entered yet.
 */
export function useHeroSlider({ count, onChange }: Options) {
  const hero = useRef<HTMLElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [meta, setMeta] = useState({ index: 0, swapping: false });
  const state = useRef({ cur: 0, elapsed: 0, visible: true, entered: false });
  const timers = useRef<number[]>([]);
  const changeRef = useRef(onChange);
  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  const go = useCallback(
    (to: number) => {
      const s = state.current;
      const from = s.cur;
      const next = (to + count) % count;
      if (next === from) return;
      s.cur = next;
      setPrev(from);
      setCur(next);
      changeRef.current?.(from, next);
      // meta line cross-fades: out for 350 ms, swap, back in
      setMeta((m) => ({ ...m, swapping: true }));
      timers.current.push(window.setTimeout(() => setMeta({ index: next, swapping: false }), 350));
      // the bar hides, waits, then starts again from empty
      s.elapsed = -BAR_GAP;
      if (bar.current) bar.current.style.opacity = '0';
      timers.current.push(
        window.setTimeout(() => {
          if (!bar.current) return;
          bar.current.style.width = '0%';
          bar.current.style.opacity = '1';
        }, 380),
      );
    },
    [count],
  );

  const next = useCallback(() => go(state.current.cur + 1), [go]);

  useEffect(() => {
    initGsap();
    const s = state.current;
    const off = onPageEnter(() => {
      s.entered = true;
      s.elapsed = 0;
    });
    const io = new IntersectionObserver(([e]) => (s.visible = e.intersectionRatio > 0.2), {
      threshold: [0, 0.2, 0.5],
    });
    if (hero.current) io.observe(hero.current);

    const tick = (_t: number, dt: number) => {
      if (!s.entered || !s.visible || document.hidden) return;
      s.elapsed += Math.min(64, dt);
      if (s.elapsed < 0) return;
      if (bar.current) bar.current.style.width = `${Math.min(100, (s.elapsed / DURATION) * 100)}%`;
      if (s.elapsed >= DURATION) next();
    };
    gsap.ticker.add(tick);
    const pending = timers.current;
    return () => {
      off();
      io.disconnect();
      gsap.ticker.remove(tick);
      pending.forEach(clearTimeout);
    };
  }, [next]);

  return { hero, bar, cur, prev, meta, next };
}
