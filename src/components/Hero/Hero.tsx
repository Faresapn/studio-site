'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import Logo from '@/components/Logo/Logo';
import { useHeroSlider } from '@/hooks/useHeroSlider';
import { animate, IO, OUT, onFrame, prefersReducedMotion, stagger } from '@/lib/motion';
import { onPageEnter } from '@/lib/transition';
import { getProject, projectHref } from '@/content/projects';
import type { HomePage } from '@/content/types';
import s from './Hero.module.css';

type Props = { hero: HomePage['hero'] };

const linesOf = (el: Element | null | undefined) => (el ? [...el.querySelectorAll<HTMLElement>('[data-line]')] : []);

/**
 * Home hero. Three slides, 6.5 s each: the photo wipes in from the right, the headline lines leave and
 * arrive with a stagger, the project name swaps vertically and the meta line cross-fades. The images
 * move at 0.32× scroll and the caption fades over the first 55% of the viewport.
 */
export default function Hero({ hero }: Props) {
  const cap = useRef<HTMLDivElement>(null);
  const groups = useRef<(HTMLSpanElement | null)[]>([]);
  const [pre, setPre] = useState(true);

  const onChange = useCallback((from: number, to: number) => {
    const rm = prefersReducedMotion();
    // old lines leave upwards through their mask, the new ones rise in a beat later
    animate(
      linesOf(groups.current[from]),
      { y: '-110%', opacity: 0 },
      { duration: rm ? 0 : 0.7, ease: IO, delay: stagger(0.06) },
    );
    animate(
      linesOf(groups.current[to]),
      { y: ['110%', '0%'], opacity: 1 },
      { duration: rm ? 0 : 1.1, ease: OUT, delay: rm ? 0 : stagger(0.08, { startDelay: 0.38 }) },
    );
  }, []);

  const { hero: root, bar, cur, prev, meta, next } = useHeroSlider({ count: hero.slides.length, onChange });

  /* intro: headline rises in once the page has entered (after the loader or a route transition) */
  useEffect(() => {
    return onPageEnter(() => {
      const lines = linesOf(groups.current[0]);
      setPre(false);
      animate(
        lines,
        { y: ['110%', '0%'], opacity: 1 },
        { duration: prefersReducedMotion() ? 0 : 1.1, ease: OUT, delay: stagger(0.08, { startDelay: 0.1 }) },
      );
    });
  }, []);

  /* parallax: photos move at 0.32× scroll, caption fades over the first 55% of the viewport */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = root.current;
    if (!el) return;
    const pars = [...el.querySelectorAll<HTMLElement>('[data-par]')];
    let last = -1;
    const tick = () => {
      const y = Math.max(0, window.scrollY);
      const vh = window.innerHeight;
      if (y === last || (y > vh * 1.3 && last > vh * 1.3)) return;
      last = y;
      pars.forEach((p) => (p.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0)`));
      if (cap.current) cap.current.style.opacity = (1 - Math.min(1, y / (vh * 0.55))).toFixed(3);
    };
    return onFrame(tick);
  }, [root]);

  const slide = hero.slides[cur];
  const project = getProject(slide.project);
  const metaText = hero.slides[meta.index].meta;

  return (
    <section
      ref={root}
      className={`${s.hero} ${pre ? s.pre : ''}`}
      aria-roledescription="carousel"
      aria-label="Featured projects"
    >
      <Logo light />

      {hero.slides.map((sl, i) => {
        const p = getProject(sl.project);
        return (
          <TransitionLink
            key={i}
            href={projectHref(sl.project)}
            flipId={`hero-${i}`}
            className={`${s.sl} ${i === cur ? s.on : ''} ${i === prev && i !== cur ? s.was : ''}`}
            aria-label={`${p?.name ?? ''}: ${sl.image.alt}`}
            aria-hidden={i !== cur}
            tabIndex={i === cur ? 0 : -1}
          >
            <span className={s.frame} data-flip-src data-hero-slide={i}>
              <span className={s.par} data-par>
                <Image
                  src={sl.image.src}
                  alt=""
                  fill
                  sizes="100vw"
                  preload={i === 0}
                  loading={i === 0 ? undefined : 'eager'}
                  placeholder="blur"
                  quality={80}
                />
              </span>
            </span>
          </TransitionLink>
        );
      })}

      <div ref={cap} className={s.cap}>
        <h1 className={s.h1}>
          {hero.slides.map((sl, i) => (
            <span
              key={i}
              ref={(el) => {
                groups.current[i] = el;
              }}
              className={`${s.hg} ${i === 0 ? s.first : ''}`}
              aria-hidden={i !== cur}
            >
              {sl.headline.map((line) => (
                <span key={line} className={s.ln}>
                  <span data-line>{line}</span>
                </span>
              ))}
            </span>
          ))}
        </h1>

        <div className={s.ix}>
          <div className={s.row}>
            <div className={s.ex}>
              <div className={s.exi}>
                <span className={`${s.hm} ${meta.swapping ? s.hsw : ''}`}>{metaText}</span>
                <TransitionLink
                  className={s.see}
                  href={projectHref(slide.project)}
                  flipId={`hero-${cur}`}
                  flipFrom={`[data-hero-slide="${cur}"]`}
                >
                  {hero.seeLabel}
                  <span className="sr-only">: {project?.name}</span>
                </TransitionLink>
              </div>
            </div>
            <div className={s.nm} aria-live="polite">
              {hero.slides.map((sl, i) => (
                <span key={i} className={i === cur ? '' : i === prev ? s.up : s.dn} aria-hidden={i !== cur}>
                  {getProject(sl.project)?.name}
                </span>
              ))}
            </div>
          </div>
          <button type="button" className={s.bar} title={hero.nextLabel} aria-label={hero.nextLabel} onClick={next}>
            <i ref={bar} />
          </button>
        </div>
      </div>
    </section>
  );
}
