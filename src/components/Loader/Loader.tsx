'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import LogoMark from '@/components/icons/LogoMark';
import { gsap, initGsap } from '@/lib/motion';
import { lockScroll } from '@/lib/scroll';
import { ready } from '@/lib/transition';
import { loaderImages } from '@/content/home';
import { img } from '@/content/images';
import { LOADER_KEY } from './keys';
import s from './Loader.module.css';

const DURATION = 2800; // count from 0 to 100
const STEP = 550; // a new photo wipes up every 550 ms
const GROW_AT = DURATION + 250; // the frame opens into the hero
const DONE_AT = DURATION + 1450; // loader removed, hero intro plays

/**
 * First-visit loader (once per session). Whether it plays is decided before first paint by the boot
 * script in the root layout, which adds `html.loading`; without that class this renders nothing visible.
 *
 * Logo left, "Loading N%" right, a small centred frame where load1-3 and then the hero photo wipe up.
 * At the end the count leaves to the right, the frame grows to fill the screen and becomes the hero.
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<'run' | 'out' | 'grow' | 'done'>('run');
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const html = document.documentElement;
    // Not playing: the markup stays hidden by CSS (no html.loading) and nothing runs.
    if (!html.classList.contains('loading')) return;
    initGsap();
    try {
      sessionStorage.setItem(LOADER_KEY, '1');
    } catch {}
    lockScroll('loader', true);

    let t = 0;
    let lastStep = -1;
    let stage = 0;
    const tick = (_time: number, dt: number) => {
      t += Math.min(64, dt);
      const p = Math.min(1, t / DURATION);
      if (pct.current) pct.current.textContent = String(Math.round((1 - (1 - p) ** 2) * 100));
      const st = Math.min(3, Math.floor(t / STEP));
      if (st !== lastStep) {
        lastStep = st;
        setStep(st);
      }
      if (stage === 0 && t > DURATION) {
        stage = 1;
        setPhase('out');
      }
      if (stage === 1 && t > GROW_AT) {
        stage = 2;
        setPhase('grow');
      }
      if (stage === 2 && t > DONE_AT) {
        stage = 3;
        gsap.ticker.remove(tick);
        html.classList.remove('loading');
        lockScroll('loader', false);
        setPhase('done');
        ready();
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lockScroll('loader', false);
    };
  }, []);

  if (phase === 'done') return null;

  const frames = [...loaderImages, img.hero1];
  return (
    <div id="loader" ref={root} className={`${s.loader} ${s[phase] ?? ''}`} aria-hidden="true">
      <div className={s.lg}>
        <LogoMark title="" />
      </div>
      <div className={s.fr}>
        {frames.map((src, i) => {
          const fin = i === frames.length - 1;
          // only the latest two photos stay "on", stacked in order, so each new one wipes over the last
          const on = i === step || (i < step && i >= step - 1);
          return (
            <Image
              key={i}
              src={src}
              alt=""
              className={`${fin ? s.fin : ''} ${on ? s.on : ''}`}
              style={{ zIndex: i }}
              {...(fin
                ? { fill: true, sizes: '100vw', quality: 80, placeholder: 'blur' as const }
                : { sizes: '(max-width: 1099px) 180px, 17vw', loading: 'eager' as const })}
            />
          );
        })}
      </div>
      <div className={s.pct}>
        Loading <span ref={pct}>0</span>%
      </div>
    </div>
  );
}
