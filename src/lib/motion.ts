'use client';

/**
 * GSAP setup shared by every animated component. The two curves are the prototype's
 * --out and --io custom properties, so JS and CSS motion share the same feel.
 */
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

let ready = false;
export function initGsap() {
  if (ready || typeof window === 'undefined') return gsap;
  gsap.registerPlugin(CustomEase);
  CustomEase.create('out', '0.22, 1, 0.36, 1');
  CustomEase.create('io', '0.65, 0, 0.35, 1');
  gsap.ticker.lagSmoothing(0);
  ready = true;
  return gsap;
}

export { gsap };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 1100;

/** One unit of the 1512px design frame in CSS pixels (1px below 1100px). */
export const unit = () => (isDesktop() ? window.innerWidth / 1512 : 1);

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Decode up to `max` eager images inside `root`, giving up after `timeout` ms. */
export function decodeImages(root: ParentNode, max = 4, timeout = 700): Promise<void> {
  const imgs = [...root.querySelectorAll<HTMLImageElement>('img:not([loading="lazy"])')].slice(0, max);
  const all = Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => undefined) : undefined)));
  return Promise.race([all.then(() => undefined), wait(timeout)]);
}
