'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { initGsap, gsap, prefersReducedMotion } from '@/lib/motion';
import { setLenis } from '@/lib/scroll';

/**
 * Smooth wheel scrolling. Replaces the prototype's lerp loop (target += deltaY, current eases 10% per frame),
 * so Lenis runs with the same lerp of 0.1. Touch, keyboard and the scrollbar stay native, and it is skipped
 * entirely on coarse pointers and with reduced motion, as in the prototype.
 */
export function useLenis() {
  useEffect(() => {
    initGsap();
    if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      // let nested scrollers (lightbox thumbnails, menu photo row) scroll themselves
      prevent: (node) => node.closest?.('[data-lenis-prevent]') != null,
    });
    setLenis(lenis);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
}
