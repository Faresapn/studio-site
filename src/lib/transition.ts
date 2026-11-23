'use client';

/**
 * Page transition controller.
 *
 * Every internal navigation goes through `navigate()` (via <TransitionLink>), and browser back/forward
 * goes through `handlePop()`. Both follow the prototype's router:
 *   leave   the current page fades out (320 ms)
 *   wait    the next route renders and its first images decode; if that takes longer than 250 ms
 *           the transit overlay (logo, line, page name) appears and stays at least 300 ms
 *   enter   scroll resets, the new page fades and rises in (800 ms) and its own intro animations start
 *
 * A navigation can carry a shared element: the clicked image is cloned into a fixed layer above the page
 * and flown to the destination's hero while the page fades, so there is never a blank frame. Back
 * navigation flies the project hero back into the card it came from when that card is on screen.
 *
 * State lives in this module rather than React so that timing is never at the mercy of re-renders.
 */
import type { useRouter } from 'next/navigation';
import { animate, IO, OUT, unit, decodeImages, prefersReducedMotion, type AnimationPlaybackControls } from './motion';
import { scrollToInstant, getLenis } from './scroll';

type Router = ReturnType<typeof useRouter>;
type Phase = 'boot' | 'leaving' | 'waiting' | 'entering' | 'idle';
type Rect = { left: number; top: number; width: number; height: number };

type Env = {
  router: Router;
  main: HTMLElement;
  showTransit: (label: string) => void;
  hideTransit: () => void;
  closeMenu: () => void;
  announce: (label: string) => void;
  pageName: (path: string) => string;
};

const LEAVE = 0.32;
const ENTER = 0.8;
const FLIGHT = 1.05;
const TRANSIT_DELAY = 250;
const TRANSIT_MIN = 300;

let env: Env | null = null;
let phase: Phase = 'boot';
let currentPath = '';
let goId = 0;
const enterCbs = new Set<() => void>();
let waiters: { path: string; resolve: () => void }[] = [];
const scrolls = new Map<string, number>();
/** The last shared-element jump, so Back can reverse it. */
let lastFlip: { from: string; to: string; id: string } | null = null;
/** The running fade on <main>, so a newer navigation can stop it. */
let mainAnim: AnimationPlaybackControls | null = null;

/* ---------------------------------------------------------------- wiring */

export function connect(e: Env) {
  env = e;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
}

export function pathChanged(path: string) {
  currentPath = path;
  const ready = waiters.filter((w) => w.path === path);
  waiters = waiters.filter((w) => w.path !== path);
  ready.forEach((w) => w.resolve());
}

/** First paint is settled (loader finished or skipped): let the page play its intro. */
export function ready() {
  if (phase !== 'boot') return;
  phase = 'idle';
  emitEnter();
}

export const isBooting = () => phase === 'boot';

/** Back to the boot state so the loader can play again: cancels transitions and clears their layers. */
export function reboot() {
  goId++;
  phase = 'boot';
  lastFlip = null;
  document.querySelectorAll('.flip-clone, .page-ghost').forEach((n) => n.remove());
  if (env) {
    stopMain();
    env.main.style.opacity = '';
    env.main.style.transform = '';
    env.hideTransit();
  }
}

/**
 * Run `cb` once the page this component belongs to has entered. Components mounted while the page is
 * hidden (during a transition or under the loader) wait; components mounted on a visible page run now.
 */
export function onPageEnter(cb: () => void): () => void {
  if (phase === 'idle' || phase === 'entering') {
    let live = true;
    queueMicrotask(() => live && cb());
    return () => {
      live = false;
    };
  }
  enterCbs.add(cb);
  return () => enterCbs.delete(cb);
}

function emitEnter() {
  const cbs = [...enterCbs];
  enterCbs.clear();
  cbs.forEach((cb) => cb());
}

function waitForPath(path: string, timeout = 8000): Promise<boolean> {
  if (currentPath === path) return Promise.resolve(true);
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), timeout);
    waiters.push({
      path,
      resolve: () => {
        clearTimeout(t);
        resolve(true);
      },
    });
  });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
function stopMain() {
  mainAnim?.stop();
  mainAnim = null;
}

/** Fade <main>; returns when the fade has finished. */
function fadeMain(main: HTMLElement, to: number, duration: number) {
  stopMain();
  mainAnim = animate(main, { opacity: to }, { duration, ease: 'easeInOut' });
  return mainAnim.finished.then(() => undefined);
}

/* ---------------------------------------------------------------- shared element helpers */

/** Where a project hero sits once the new page is scrolled to the top (mirrors .hero in CSS). */
export function heroRect(): Rect {
  const width = document.documentElement.clientWidth;
  const h = window.innerHeight;
  // 100vh with a floor of 620 design units (620px below 1100px), as in the prototype's final .hero rule
  const height = Math.max(h, 620 * unit());
  return { left: 0, top: 0, width, height };
}

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

const onScreen = (r: Rect) => r.top < window.innerHeight && r.top + r.height > 0 && r.width > 0;

/**
 * Clone an image box into a fixed layer exactly over it. The clone copies the image's current
 * transform (hover zoom, parallax offset) so the hand-over is seamless, then eases that back to rest.
 */
export function makeClone(box: HTMLElement): HTMLDivElement | null {
  const img = box instanceof HTMLImageElement ? box : box.querySelector('img');
  if (!img) return null;
  const r = rectOf(box);
  const clone = document.createElement('div');
  clone.className = 'flip-clone';
  clone.setAttribute('aria-hidden', 'true');
  Object.assign(clone.style, {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  });
  const ci = document.createElement('img');
  ci.alt = '';
  ci.decoding = 'sync';
  ci.src = img.currentSrc || img.src;
  ci.style.objectPosition = getComputedStyle(img).objectPosition;
  clone.appendChild(ci);
  // The visible source is sized for a card; layer the full-width rendition on top as soon as it arrives.
  if (img.srcset) {
    const hi = document.createElement('img');
    hi.alt = '';
    hi.sizes = '100vw';
    hi.srcset = img.srcset;
    hi.className = 'flip-hi';
    hi.onload = () => hi.classList.add('on');
    clone.appendChild(hi);
  }
  document.body.appendChild(clone);

  const m = new DOMMatrix(getComputedStyle(img).transform === 'none' ? undefined : getComputedStyle(img).transform);
  const ir = img.getBoundingClientRect();
  // parallax offset = where the image is drawn relative to its box
  const y0 = ir.top - r.top - (ir.height - r.height) / 2;
  animate(
    [...clone.children] as HTMLElement[],
    { x: [m.m41, 0], y: [y0, 0], scale: [m.a || 1, 1] },
    { duration: FLIGHT, ease: IO },
  );
  return clone;
}

/** Move the clone's box (it is position: fixed, so left/top/width/height are the box itself). */
function fly(clone: HTMLElement, to: Rect, duration = FLIGHT) {
  return animate(
    clone,
    { left: to.left, top: to.top, width: to.width, height: to.height },
    { duration, ease: IO },
  ).finished.then(() => undefined);
}

const fadeOut = (el: HTMLElement, duration: number) =>
  animate(el, { opacity: 0 }, { duration, ease: 'easeOut' }).finished.then(() => undefined);

/** Fade the clone out once the real image underneath has decoded, then drop it. */
async function settleClone(clone: HTMLElement, target: Element | null) {
  const img = target?.querySelector('img');
  if (img?.decode) await Promise.race([img.decode().catch(() => undefined), sleep(1200)]);
  await fadeOut(clone, 0.45);
  clone.remove();
}

/** A frozen copy of the outgoing page, used on Back/Forward where Next swaps the DOM immediately. */
function makeGhost(main: HTMLElement): HTMLDivElement {
  const ghost = document.createElement('div');
  ghost.className = 'page-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  const copy = main.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  copy.removeAttribute('id');
  copy.style.transform = `translateY(${-window.scrollY}px)`;
  copy.style.opacity = '1';
  ghost.appendChild(copy);
  document.body.appendChild(ghost);
  return ghost;
}

/* ---------------------------------------------------------------- forward navigation */

type NavOptions = { flipEl?: HTMLElement | null; flipId?: string };

export async function navigate(href: string, opts: NavOptions = {}) {
  if (!env) return void (window.location.href = href);
  const { router, main } = env;
  const url = new URL(href, window.location.href);
  const path = url.pathname;
  env.closeMenu();

  if (path === currentPath) {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    return;
  }

  const id = ++goId;
  scrolls.set(currentPath, window.scrollY);
  lastFlip = opts.flipEl && opts.flipId ? { from: currentPath, to: path, id: opts.flipId } : null;

  if (prefersReducedMotion()) {
    router.push(url.pathname + url.search + url.hash, { scroll: false });
    const ok = await waitForPath(path);
    if (id !== goId) return;
    if (!ok) return void (window.location.href = href);
    scrollToInstant(0);
    phase = 'idle';
    emitEnter();
    focusPage(path);
    return;
  }

  phase = 'leaving';
  getLenis()?.stop();
  const clone = opts.flipEl ? makeClone(opts.flipEl) : null;
  const flight = clone ? fly(clone, heroRect()) : null;

  await fadeMain(main, 0, LEAVE);
  if (id !== goId) return clone?.remove();

  router.push(url.pathname + url.search + url.hash, { scroll: false });
  phase = 'waiting';
  let shownAt = 0;
  const timer = setTimeout(() => {
    if (id !== goId || clone) return;
    shownAt = performance.now();
    env?.showTransit(env.pageName(path));
  }, TRANSIT_DELAY);

  const arrived = await waitForPath(path);
  if (id !== goId) return clone?.remove();
  if (!arrived) return void (window.location.href = href);
  await decodeImages(main);
  clearTimeout(timer);
  if (id !== goId) return clone?.remove();
  if (shownAt) await sleep(Math.max(0, TRANSIT_MIN - (performance.now() - shownAt)));
  if (id !== goId) return clone?.remove();

  scrollToInstant(0);
  getLenis()?.start();
  if (flight) await flight;
  if (id !== goId) return clone?.remove();

  const target = main.querySelector('[data-flip-target]');
  if (clone && target) {
    const real = rectOf(target);
    const now = rectOf(clone);
    if (Math.abs(real.height - now.height) > 1 || Math.abs(real.width - now.width) > 1) await fly(clone, real, 0.35);
  }

  env.hideTransit();
  enterPage(main, !!clone);
  if (clone) void settleClone(clone, target);
  focusPage(path);
}

function enterPage(main: HTMLElement, steady: boolean) {
  phase = 'entering';
  emitEnter();
  stopMain();
  const anim = animate(main, { opacity: [0, 1], y: [steady ? 0 : 14 * unit(), 0] }, { duration: ENTER, ease: OUT });
  mainAnim = anim;
  void anim.finished.then(() => {
    if (mainAnim !== anim) return;
    main.style.transform = ''; // a transform would make <main> the containing block for fixed children
    if (phase === 'entering') phase = 'idle';
  });
}

function focusPage(path: string) {
  if (!env) return;
  env.main.focus({ preventScroll: true });
  env.announce(env.pageName(path));
}

/* ---------------------------------------------------------------- back / forward */

/**
 * Next swaps the page right after popstate, so the outgoing page is frozen into a ghost layer first.
 * If we are leaving the project we flew into, its hero flies back to the card it came from.
 */
export async function handlePop() {
  if (!env) return;
  const { main } = env;
  const to = window.location.pathname;
  const from = currentPath;
  if (to === from) return;
  const id = ++goId;
  scrolls.set(from, window.scrollY);
  env.closeMenu();

  if (prefersReducedMotion()) {
    if (!(await waitForPath(to))) return;
    scrollToInstant(scrolls.get(to) ?? 0);
    phase = 'idle';
    emitEnter();
    focusPage(to);
    return;
  }

  phase = 'leaving';
  const ghost = makeGhost(main);
  const reverse = lastFlip && lastFlip.to === from && lastFlip.from === to ? lastFlip : null;
  let clone: HTMLDivElement | null = null;
  if (reverse) {
    const hero = main.querySelector<HTMLElement>('[data-flip-target]');
    if (hero && onScreen(rectOf(hero))) {
      clone = makeClone(hero);
      ghost.querySelector<HTMLElement>('[data-flip-target]')?.style.setProperty('visibility', 'hidden');
    }
  }
  stopMain();
  main.style.opacity = '0';
  const leaving = fadeOut(ghost, LEAVE).then(() => ghost.remove());

  phase = 'waiting';
  if (!(await waitForPath(to))) {
    ghost.remove();
    clone?.remove();
    return;
  }
  await Promise.all([decodeImages(main), leaving]);
  if (id !== goId) return clone?.remove();
  scrollToInstant(scrolls.get(to) ?? 0);
  getLenis()?.start();

  const card = reverse ? main.querySelector<HTMLElement>(`[data-flip-id="${reverse.id}"] [data-flip-src]`) : null;
  if (clone && card && onScreen(rectOf(card))) {
    enterPage(main, true);
    await fly(clone, rectOf(card), 0.9);
    await fadeOut(clone, 0.3);
    clone.remove();
  } else {
    if (clone) void fadeOut(clone, 0.4).then(() => clone?.remove());
    enterPage(main, false);
  }
  lastFlip = null;
  focusPage(to);
}
