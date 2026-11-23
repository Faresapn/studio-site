'use client';

/**
 * Motion setup shared by every animated component.
 * OUT and IO are the prototype's --out and --io custom properties, so JS and CSS motion share one feel.
 * No springs with overshoot: this is a quiet architecture site.
 */
import { animate, cancelFrame, frame, stagger, type AnimationPlaybackControls } from 'motion';

export { animate, stagger };
export type { AnimationPlaybackControls };

export const OUT = [0.22, 1, 0.36, 1] as const;
export const IO = [0.65, 0, 0.35, 1] as const;

type Tick = (timestamp: number, delta: number) => void;

/** Run `fn` every frame (Motion's frame loop, shared with its animations and with Lenis). */
export function onFrame(fn: Tick): () => void {
  const process = ({ timestamp, delta }: { timestamp: number; delta: number }) => fn(timestamp, delta);
  frame.update(process, true);
  return () => cancelFrame(process);
}

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
