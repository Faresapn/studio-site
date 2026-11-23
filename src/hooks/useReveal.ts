'use client';

import { useEffect, type RefObject } from 'react';
import { onPageEnter } from '@/lib/transition';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * Reveal on scroll, ported from the prototype.
 * Content is visible at rest. When the page enters, anything sitting below 72% of the viewport is "armed"
 * (hidden) and revealed once it is a third of the way up the screen (rootMargin bottom -30%).
 * Cards that share a row stagger by 90 ms; their title and meta follow 250 ms later.
 *
 * Marks: `.rv` (fade and rise) and `[data-rc]` (cards: the photo unmasks, the caption follows).
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scope.current;
    if (!root || prefersReducedMotion()) return;
    let io: IntersectionObserver | null = null;
    const timers: number[] = [];

    const off = onPageEnter(() => {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            el.classList.remove('arm');
            io?.unobserve(el);
            // clear the stagger delays once revealed, so hover transitions are not delayed
            timers.push(
              window.setTimeout(() => {
                el.querySelectorAll<HTMLElement>('[data-d]').forEach((d) => (d.style.transitionDelay = ''));
              }, 1900),
            );
          }),
        { rootMargin: '0px 0px -30% 0px' },
      );

      root.querySelectorAll<HTMLElement>('.rv, [data-rc]').forEach((el) => {
        if (el.getBoundingClientRect().top > window.innerHeight * 0.72) {
          el.classList.add('arm');
          io?.observe(el);
        } else el.classList.remove('arm');
      });

      // stagger cards that share a row
      root.querySelectorAll<HTMLElement>('[data-grid]').forEach((grid) => {
        let top: number | null = null;
        let k = 0;
        grid.querySelectorAll<HTMLElement>('[data-rc]').forEach((card) => {
          if (card.offsetTop !== top) {
            top = card.offsetTop;
            k = 0;
          }
          const d = k++ * 90;
          card.querySelectorAll<HTMLElement>('[data-d="im"]').forEach((e) => (e.style.transitionDelay = `${d}ms`));
          card
            .querySelectorAll<HTMLElement>('[data-d="tx"]')
            .forEach((e) => (e.style.transitionDelay = `${d + 250}ms`));
        });
      });
    });

    return () => {
      off();
      io?.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [scope]);
}
