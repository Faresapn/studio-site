'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motionValue } from 'motion';
import LogoMark from '@/components/icons/LogoMark';
import { animate, IO, OUT, isDesktop, unit } from '@/lib/motion';
import { lockScroll } from '@/lib/scroll';
import { ready } from '@/lib/transition';
import { loaderImages } from '@/content/home';
import { img } from '@/content/images';
import { LOADER_KEY } from './keys';
import s from './Loader.module.css';

const COUNT = 2.8; // s, 0 → 100
const STEP = 0.55; // s, a new house every 550 ms
const GROW_AT = COUNT + 0.25; // the frame opens into the hero
const GROW = 1.25;

/** ease-out quad, the prototype's 1 - (1 - p)² count curve */
const COUNT_EASE = [0.5, 1, 0.89, 1] as const;

/** Odometer column offset: the tens/hundreds only roll while the column to their right passes 9 → 0. */
function rolling(v: number, place: number) {
  const below = v % place; // e.g. for tens: the ones value
  const whole = Math.floor(v / place) % 10;
  const carry = Math.min(1, Math.max(0, below - (place - 1)));
  return place === 1 ? v % 10 : whole + carry;
}

/**
 * First-visit loader (once per session, or replayed by the Refresh button).
 * The boot script in the root layout adds `html.loading` before first paint; without it this stays hidden.
 *
 * Built with Motion, on the prototype's timeline:
 * - a small centred frame where three houses and then the hero photo arrive every 550 ms. Each one wipes
 *   up and settles from a slight zoom while the house underneath is pushed gently upwards, like a stack of
 *   prints being turned over
 * - "Loading 000%" counts as an odometer on an ease-out curve over 2.8 s, a hairline under the frame fills
 * - at 2.8 s the logo drifts up, the count leaves to the right and the hairline retracts
 * - at +250 ms the frame opens to the full screen while the hero photo settles from its zoom, landing
 *   exactly as the home hero; then the loader is removed and the hero headline rises
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el || !html.classList.contains('loading')) return;
    try {
      sessionStorage.setItem(LOADER_KEY, '1');
    } catch {}
    lockScroll('loader', true);

    const q = <T extends Element = HTMLElement>(sel: string) => [...el.querySelectorAll<T & HTMLElement>(sel)];
    const photos = q('[data-ph]');
    const inners = q('[data-in]');
    const [fr] = q('[data-fr]');
    const [line] = q('[data-line]');
    const [lg] = q('[data-lg]');
    const [pct] = q('[data-pct]');
    const cols = q('[data-col]');
    const anims: { stop: () => void }[] = [];
    const run = (...a: Parameters<typeof animate>) => {
      const c = animate(...a);
      anims.push(c);
      return c;
    };

    /* count + hairline */
    const v = motionValue(0);
    const off = v.on('change', (n) => {
      const places = [100, 10, 1];
      for (let i = 0; i < cols.length; i++) {
        cols[i].style.transform = `translateY(${(-rolling(n, places[i]) * 100) / 11}%)`;
      }
      line.style.transform = `scaleX(${n / 100})`;
    });
    anims.push(animate(v, 100, { duration: COUNT, ease: COUNT_EASE }));

    /* houses: wipe up, settle from zoom, push the previous one up */
    photos.forEach((ph, i) => {
      const at = i * STEP;
      const fin = i === photos.length - 1;
      run(ph, { clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: 0.9, ease: IO, delay: at });
      run(inners[i], { scale: fin ? [1.4, 1.16] : [1.3, 1] }, { duration: fin ? 1.6 : 1.4, ease: OUT, delay: at });
      if (i > 0) run(inners[i - 1], { y: ['0%', '-9%'] }, { duration: 0.9, ease: IO, delay: at });
    });

    /* exit: logo up, count right, hairline retracts */
    const mobile = !isDesktop();
    const u = unit();
    run(lg, { y: mobile ? -40 : -90 * u, opacity: 0 }, { duration: 1.2, ease: OUT, delay: COUNT });
    run(pct, { x: mobile ? 120 : 120 * u, opacity: 0 }, { duration: 0.9, ease: IO, delay: COUNT });
    if (line.parentElement) run(line.parentElement, { opacity: 0 }, { duration: 0.5, ease: 'easeOut', delay: COUNT });

    /* open: the frame grows to the viewport while the hero photo settles to scale 1 */
    const fw = mobile ? 180 : 256 * u;
    const fh = mobile ? 270 : 384 * u;
    const iy = Math.max(0, (window.innerHeight - fh) / 2);
    const ix = Math.max(0, (window.innerWidth - fw) / 2);
    run(fr, { clipPath: [`inset(${iy}px ${ix}px)`, 'inset(0px 0px)'] }, { duration: GROW, ease: IO, delay: GROW_AT });
    const settle = run(inners[inners.length - 1], { scale: 1 }, { duration: GROW, ease: IO, delay: GROW_AT });

    let live = true;
    void settle.finished.then(() => {
      if (!live) return;
      html.classList.remove('loading');
      lockScroll('loader', false);
      setDone(true);
      ready();
    });

    return () => {
      live = false;
      off();
      anims.forEach((a) => a.stop());
      lockScroll('loader', false);
    };
  }, []);

  if (done) return null;

  const frames = [...loaderImages, img.hero1];
  const digits = [...Array(10).keys(), 0];
  return (
    <div id="loader" ref={root} className={s.loader} aria-hidden="true">
      <div className={s.lg} data-lg>
        <LogoMark title="" />
      </div>

      <div className={s.fr} data-fr>
        {frames.map((src, i) => {
          const fin = i === frames.length - 1;
          return (
            <div key={i} className={`${s.ph} ${fin ? s.fin : ''}`} style={{ zIndex: i }} data-ph>
              <div className={s.in} data-in>
                <Image
                  src={src}
                  alt=""
                  fill
                  loading="eager"
                  {...(fin
                    ? { sizes: '100vw', quality: 80, fetchPriority: 'high' as const }
                    : { sizes: '(max-width: 1099px) 180px, 17vw' })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={s.line}>
        <i data-line />
      </div>

      <div className={s.pct} data-pct>
        Loading{' '}
        <span className={s.odo}>
          {[0, 1, 2].map((c) => (
            <span key={c} className={s.mask}>
              <span className={s.col} data-col>
                {digits.map((d, k) => (
                  <span key={k}>{d}</span>
                ))}
              </span>
            </span>
          ))}
        </span>
        %
      </div>
    </div>
  );
}
