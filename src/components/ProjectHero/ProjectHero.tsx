'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import Logo from '@/components/Logo/Logo';
import { animate, OUT, onFrame, prefersReducedMotion, stagger } from '@/lib/motion';
import { onPageEnter } from '@/lib/transition';
import type { Project } from '@/content/types';
import s from './ProjectHero.module.css';

/**
 * Full-bleed project hero. The image box is the shared-element target (`data-flip-target`): cards and
 * hero slides fly into it, and Back flies it out again. Name and meta rise in line by line once the
 * page has entered, in the same style as the home hero.
 */
export default function ProjectHero({ project }: { project: Project }) {
  const root = useRef<HTMLElement>(null);
  const cap = useRef<HTMLDivElement>(null);
  const par = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lines = root.current ? [...root.current.querySelectorAll<HTMLElement>('[data-line]')] : [];
    return onPageEnter(() => {
      root.current?.classList.remove(s.pre);
      animate(
        lines,
        { y: ['110%', '0%'] },
        { duration: prefersReducedMotion() ? 0 : 1.1, ease: OUT, delay: stagger(0.08, { startDelay: 0.15 }) },
      );
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let last = -1;
    const tick = () => {
      const y = Math.max(0, window.scrollY);
      const vh = window.innerHeight;
      if (y === last || (y > vh * 1.3 && last > vh * 1.3)) return;
      last = y;
      if (par.current) par.current.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0)`;
      if (cap.current) cap.current.style.opacity = (1 - Math.min(1, y / (vh * 0.55))).toFixed(3);
    };
    return onFrame(tick);
  }, []);

  const meta = [project.category, project.year, project.location];
  return (
    <section ref={root} className={`${s.hero} ${s.pre}`}>
      <Logo light />
      <div className={s.frame} data-flip-target>
        <div ref={par} className={s.par}>
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            fill
            sizes="100vw"
            preload
            quality={80}
            placeholder="blur"
          />
        </div>
      </div>
      <div ref={cap} className={s.cap}>
        <h1 className={s.h1}>
          <span className={s.ln}>
            <span data-line>{project.name}</span>
          </span>
        </h1>
        <p className={s.meta}>
          {meta.map((m, i) => (
            <span key={i} className={s.ln}>
              <span data-line>{m}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
