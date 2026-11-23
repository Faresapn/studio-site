'use client';

import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { animate, IO, OUT, isDesktop, prefersReducedMotion, unit } from '@/lib/motion';
import { lockScroll } from '@/lib/scroll';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { Media } from '@/content/types';
import s from './Lightbox.module.css';

type Props = {
  images: Media[];
  start: number;
  title: string;
  /** The thumbnail box for photo i, used to grow out of it and shrink back into it. */
  thumbFor: (i: number) => HTMLElement | null;
  onClosed: () => void;
};

type Rect = { left: number; top: number; width: number; height: number };

/** The photo's box: as large as fits inside the stage margins, keeping its own proportions. */
function fitRect(m: Media): Rect {
  const u = unit();
  const pad = isDesktop() ? { l: 140 * u, r: 140 * u, t: 40 * u, b: 110 * u } : { l: 0, r: 0, t: 64, b: 132 };
  const W = window.innerWidth - pad.l - pad.r;
  const H = window.innerHeight - pad.t - pad.b;
  const k = Math.min(W / m.src.width, H / m.src.height);
  const width = m.src.width * k;
  const height = m.src.height * k;
  return { left: pad.l + (W - width) / 2, top: pad.t + (H - height) / 2, width, height };
}

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};
const onScreen = (r: Rect) => r.top < window.innerHeight && r.top + r.height > 0;
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Place the box instantly (it is position: fixed, so these are its viewport coordinates). */
function place(el: HTMLElement | null, r: Rect) {
  if (!el) return;
  el.style.left = `${r.left}px`;
  el.style.top = `${r.top}px`;
  el.style.width = `${r.width}px`;
  el.style.height = `${r.height}px`;
}
const asKeyframes = (a: Rect, b: Rect) => ({
  left: [a.left, b.left],
  top: [a.top, b.top],
  width: [a.width, b.width],
  height: [a.height, b.height],
});

/**
 * Full-screen photo viewer. Opens by growing the clicked thumbnail into place (FLIP), steps with the
 * arrows, arrow keys or a swipe, and closes with Escape, the close button or a click on the backdrop,
 * shrinking back into the thumbnail when it is on screen. Focus is trapped while open.
 */
export default function Lightbox({ images, start, title, thumbFor, onClosed }: Props) {
  const [index, setIndex] = useState(start);
  const [, setSize] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const chrome = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const dir = useRef(0);
  const swipe = useRef<number | null>(null);
  const swiped = useRef(false);
  useFocusTrap(root, true, '[data-lb-close]');

  const rm = prefersReducedMotion();
  const m = images[index];
  const lowSrc = thumbFor(index)?.querySelector('img')?.currentSrc;

  /* open: grow out of the thumbnail */
  useLayoutEffect(() => {
    lockScroll('lightbox', true);
    const from = thumbFor(start);
    const to = fitRect(images[start]);
    place(box.current, to);
    if (bg.current) animate(bg.current, { opacity: [0, 1] }, { duration: rm ? 0 : 0.5, ease: 'easeOut' });
    if (chrome.current) animate(chrome.current, { opacity: [0, 1] }, { duration: rm ? 0 : 0.5, delay: rm ? 0 : 0.45 });
    if (from && !rm && box.current) animate(box.current, asKeyframes(rectOf(from), to), { duration: 0.9, ease: IO });
    return () => lockScroll('lightbox', false);
    // run once on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* after a step: place the new photo and slide it in from the side we are heading to */
  useLayoutEffect(() => {
    if (!dir.current) return;
    const el = box.current;
    if (!el) return;
    place(el, fitRect(images[index]));
    void animate(
      el,
      { opacity: [0, 1], x: [dir.current * 40, 0] },
      { duration: rm ? 0 : 0.6, ease: OUT },
    ).finished.then(() => {
      busy.current = false;
    });
  }, [index, images, rm]);

  const step = useCallback(
    (d: 1 | -1) => {
      if (busy.current || images.length < 2) return;
      busy.current = true;
      dir.current = d;
      if (!box.current) return;
      void animate(box.current, { opacity: 0, x: -d * 40 }, { duration: rm ? 0 : 0.3, ease: 'easeIn' }).finished.then(
        () => setIndex((i) => (i + d + images.length) % images.length),
      );
    },
    [images.length, rm],
  );

  const close = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    const thumb = thumbFor(index);
    const done = () => onClosed();
    const el = box.current;
    if (chrome.current) animate(chrome.current, { opacity: 0 }, { duration: rm ? 0 : 0.25 });
    if (bg.current)
      animate(bg.current, { opacity: 0 }, { duration: rm ? 0 : 0.6, delay: rm ? 0 : 0.2, ease: 'easeInOut' });
    if (!el) return done();
    if (thumb && onScreen(rectOf(thumb)) && !rm) {
      void animate(el, { ...asKeyframes(rectOf(el), rectOf(thumb)), x: 0 }, { duration: 0.8, ease: IO }).finished.then(
        done,
      );
    } else {
      void animate(el, { opacity: 0 }, { duration: rm ? 0 : 0.4 }).finished.then(done);
    }
  }, [index, thumbFor, onClosed, rm]);

  /* keys */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, step]);

  /* keep the photo fitted when the window changes */
  useEffect(() => {
    const onResize = () => {
      place(box.current, fitRect(images[index]));
      setSize((n) => n + 1);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [images, index]);

  return createPortal(
    <div ref={root} className={s.lb} role="dialog" aria-modal="true" aria-label={`${title} photos`}>
      <div ref={bg} className={s.bg} onClick={close} />
      <div
        className={s.stage}
        onClick={() => {
          // a swipe ends with a click too; only a plain tap on the backdrop closes
          if (swiped.current) swiped.current = false;
          else close();
        }}
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          swiped.current = Math.abs(dx) > 50;
          if (swiped.current) step(dx < 0 ? 1 : -1);
        }}
      />
      <div ref={box} className={s.box}>
        {lowSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.low} src={lowSrc} alt="" aria-hidden="true" />
        )}
        <Image key={index} src={m.src} alt={m.alt} fill sizes="90vw" quality={80} />
      </div>

      <div ref={chrome} className={s.chrome}>
        <button type="button" className={s.x} data-lb-close aria-label="Close photos" onClick={close} />
        {images.length > 1 && (
          <div className={s.ar}>
            <button type="button" aria-label="Previous photo" onClick={() => step(-1)}>
              <svg viewBox="0 0 40 12" aria-hidden="true">
                <path d="M40 6H1M6 1 1 6l5 5" fill="none" stroke="currentColor" />
              </svg>
            </button>
            <button type="button" aria-label="Next photo" onClick={() => step(1)}>
              <svg viewBox="0 0 40 12" aria-hidden="true">
                <path d="M0 6h39M34 1l5 5-5 5" fill="none" stroke="currentColor" />
              </svg>
            </button>
          </div>
        )}
        <div className={s.gct} aria-live="polite">
          {pad2(index + 1)} / {pad2(images.length)}
        </div>
      </div>
    </div>,
    document.body,
  );
}
