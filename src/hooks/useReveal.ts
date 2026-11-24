'use client';

import { useEffect, type RefObject } from 'react';
import { onPageEnter } from '@/lib/transition';
import { animate, OUT, prefersReducedMotion, stagger, unit } from '@/lib/motion';

/**
 * Reveal on scroll, ported from the prototype.
 * Content is visible at rest. When the page enters, anything sitting below 72% of the viewport is "armed"
 * (hidden) and revealed once it is a third of the way up the screen (rootMargin bottom -30%).
 * Cards that share a row stagger by 90 ms; their title and meta follow 250 ms later.
 *
 * Marks: `.rv` (fade and rise) and `[data-rc]` (cards: the photo unmasks, the caption follows), both
 * CSS transitions as in the prototype. Two Motion-driven marks are added on top:
 * `[data-stagger]` (its direct children fade and rise one after another, 110 ms apart) and
 * `[data-zoom]` (a photo settles from 1.12× to 1× as it comes into view, the prototype's loader move).
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scope.current;
    if (!root || prefersReducedMotion()) return;
    let io: IntersectionObserver | null = null;
    const timers: number[] = [];

    const below = (el: Element, at = 0.72) => el.getBoundingClientRect().top > window.innerHeight * at;
    const kids = (el: HTMLElement) => [...el.children] as HTMLElement[];
    const play = (el: HTMLElement) =>
      animate(kids(el), { opacity: [0, 1], y: [28 * unit(), 0] }, { duration: 1.1, ease: OUT, delay: stagger(0.11) });
    const zoom = (el: HTMLElement, from = 1.12) =>
      animate(el, { scale: [from, 1] }, { duration: 1.8, ease: OUT });

    const off = onPageEnter(() => {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            io?.unobserve(el);
            if (el.hasAttribute('data-stagger')) return play(el);
            if (el.hasAttribute('data-zoom')) return zoom(el);
            el.classList.remove('arm');
            // clear the stagger delays once revealed, so hover transitions are not delayed
            timers.push(
              window.setTimeout(() => {
                el.querySelectorAll<HTMLElement>('[data-d]').forEach((d) => (d.style.transitionDelay = ''));
              }, 1900),
            );
          }),
        { rootMargin: '0px 0px -30% 0px' },
      );

      root.querySelectorAll<HTMLElement>('[data-stagger]').forEach((el) => {
        if (below(el)) {
          kids(el).forEach((k) => {
            k.style.opacity = '0';
            k.style.transform = `translateY(${28 * unit()}px)`;
          });
          io?.observe(el);
        }
      });
      root.querySelectorAll<HTMLElement>('[data-zoom]').forEach((el) => {
        if (below(el, 1)) {
          el.style.transform = 'scale(1.12)';
          io?.observe(el);
        } else if (el.getBoundingClientRect().bottom > 0) zoom(el, 1.08); // on screen at entry: settle at once
      });

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
