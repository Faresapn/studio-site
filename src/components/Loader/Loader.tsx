'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import LogoMark from '@/components/icons/LogoMark';
import { lockScroll } from '@/lib/scroll';
import { ready } from '@/lib/transition';
import { loaderImages } from '@/content/home';
import { img } from '@/content/images';
import { LOADER_KEY } from './keys';
import s from './Loader.module.css';

/** Loader removed this long after it first painted (2.8 s count + 1.45 s for the frame to open). */
const DONE_AT = 4250;

/**
 * First-visit loader (once per session). Whether it plays is decided before first paint by the boot
 * script in the root layout, which adds `html.loading`; without that class the markup stays hidden.
 *
 * The whole sequence runs in CSS from the first paint, so it never waits for JavaScript:
 * logo left, "Loading N%" right (a @property counter on an ease-out curve), a small centred frame where
 * load1-3 and then the hero photo wipe up every 550 ms. At 2.8 s the count leaves to the right, at
 * +250 ms the frame grows to fill the screen and becomes the hero. JS only removes it at +1450 ms and
 * lets the hero intro play.
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains('loading')) return;
    try {
      sessionStorage.setItem(LOADER_KEY, '1');
    } catch {}
    lockScroll('loader', true);

    // the CSS animations started with the first paint; finish relative to that, not to hydration
    const started = root.current?.getAnimations({ subtree: true })[0]?.startTime;
    const now = document.timeline.currentTime;
    const elapsed = typeof started === 'number' && typeof now === 'number' ? now - started : 0;
    const t = window.setTimeout(
      () => {
        html.classList.remove('loading');
        lockScroll('loader', false);
        setDone(true);
        ready();
      },
      Math.max(0, DONE_AT - elapsed),
    );
    return () => {
      clearTimeout(t);
      lockScroll('loader', false);
    };
  }, []);

  if (done) return null;

  const frames = [...loaderImages, img.hero1];
  return (
    <div id="loader" ref={root} className={s.loader} aria-hidden="true">
      <div className={s.lg}>
        <LogoMark title="" />
      </div>
      <div className={s.fr}>
        {frames.map((src, i) => {
          const fin = i === frames.length - 1;
          return (
            <Image
              key={i}
              src={src}
              alt=""
              className={fin ? s.fin : ''}
              style={{ zIndex: i, animationDelay: `${i * 550}ms` }}
              loading="eager"
              {...(fin
                ? { fill: true, sizes: '100vw', quality: 80, fetchPriority: 'high' as const }
                : { sizes: '(max-width: 1099px) 180px, 17vw' })}
            />
          );
        })}
      </div>
      <div className={s.pct}>
        Loading <span className={s.count} />%
      </div>
    </div>
  );
}
