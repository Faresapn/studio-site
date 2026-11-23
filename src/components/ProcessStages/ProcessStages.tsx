'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { onFrame, prefersReducedMotion } from '@/lib/motion';
import { getLenis } from '@/lib/scroll';
import type { ProcessPage } from '@/content/types';
import s from './ProcessStages.module.css';

// Remotion + Three load only here, after the page is interactive
const ProcessBuild = dynamic(() => import('@/components/ProcessBuild/ProcessBuild'), { ssr: false });

const N = 6;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The pinned Process section (the prototype's layout B). The section is 7 screens tall; while it is
 * pinned, scroll is mapped to a build progress 0..6 that eases toward the scroll position, as in the
 * prototype (7.5% per frame). The list on the left follows the current stage; the house on the right
 * is a Remotion composition seeked to the matching frame. At the end the as-built photo fades in.
 */
export default function ProcessStages({ page }: { page: ProcessPage }) {
  const sec = useRef<HTMLElement>(null);
  const stk = useRef<HTMLDivElement>(null);
  const pline = useRef<HTMLElement>(null);
  const photo = useRef<HTMLElement>(null);
  // a stable mutable object shared with the Player: written every frame, never causes a render
  const [progress] = useState(() => ({ current: 0 }));
  const [cur, setCur] = useState(0);

  const span = () => Math.max(1, (sec.current?.offsetHeight ?? 1) - (stk.current?.offsetHeight ?? 0));
  const top = () => (sec.current ? sec.current.getBoundingClientRect().top + window.scrollY : 0);

  useEffect(() => {
    let shown = -1;
    const rm = prefersReducedMotion();
    return onFrame(() => {
      const el = sec.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
      const target = clamp(-r.top / span()) * N;
      let pc = progress.current;
      pc += (target - pc) * (rm ? 1 : 0.075);
      if (Math.abs(target - pc) < 0.0005) pc = target;
      progress.current = pc;

      const i = Math.min(N - 1, Math.floor(pc));
      if (i !== shown) {
        shown = i;
        setCur(i);
      }
      if (pline.current) pline.current.style.transform = `scaleX(${(pc / N).toFixed(4)})`;
      const ph = smooth(clamp((pc - 5.6) / 0.33));
      if (photo.current) {
        photo.current.style.opacity = ph.toFixed(3);
        const img = photo.current.firstElementChild as HTMLElement | null;
        if (img) img.style.transform = `scale(${(1.04 - 0.04 * ph).toFixed(4)})`;
      }
    });
  }, [progress]);

  /** Scroll to the middle of stage i's stretch. */
  const jump = (i: number) => {
    const y = top() + span() * ((i + 0.62) / N);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <section ref={sec} className={s.pr2} aria-labelledby="stages-title">
      <div ref={stk} className={s.stk}>
        <div className={s.pside}>
          <h2 id="stages-title" className={s.lab}>
            {page.stagesLabel}
          </h2>
          <ol className={s.plist}>
            {page.stages.map((st, i) => (
              <li key={st.number}>
                <button
                  type="button"
                  className={`${s.ps} ${i === cur ? s.cur : ''}`}
                  onClick={() => jump(i)}
                  aria-current={i === cur ? 'step' : undefined}
                >
                  <span className={s.no}>{pad(st.number)}</span>
                  <span className={s.tt}>{st.title}</span>
                  <span className={s.cp}>
                    <span>
                      <span>{st.copy}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className={s.pfoot} aria-hidden="true">
            <span className={s.count}>{pad(cur + 1)}</span>
            <span className={s.pl}>
              <i ref={pline} />
            </span>
            <span>{pad(N)}</span>
          </div>
        </div>

        <div className={s.pstage} role="img" aria-label={page.build.ariaLabel}>
          <ProcessBuild labels={page.build.labels} progress={progress} />
          <figure ref={photo} className={s.pphoto}>
            <Image
              src={page.build.photo.src}
              alt={page.build.photo.alt}
              fill
              sizes="(max-width: 1099px) 100vw, 60vw"
              placeholder="blur"
            />
            <figcaption>{page.build.photoCaption}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
