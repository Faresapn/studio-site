'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { onFrame } from '@/lib/motion';
import type { SceneLabel } from '@/content/types';
import { clamp, createHouse, placeCamera } from './scene';
import s from './ProcessBuild.module.css';

type Props = {
  labels: SceneLabel[];
  /** Build progress 0..6, written by the scroll handler of the Process section. */
  progress: { current: number };
  /** Called when WebGL is unavailable, so the section can show the as-built photo instead. */
  onFail?: () => void;
};

/**
 * The Process house on plain Three.js, as in the prototype. It renders only when something changed: the
 * build progress, the pointer sway or the stage size. Labels are HTML on top, projected with the same
 * camera and hidden when they would overlap one already placed. Loaded with next/dynamic, so Three
 * never ships to pages without the Process build.
 */
export default function ProcessBuild({ labels, progress, onFail }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tagEls = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stage = box.current;
    const cv = canvas.current;
    if (!stage || !cv) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    } catch {
      onFail?.();
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const house = createHouse();
    const scene = new THREE.Scene();
    scene.background = house.background;
    scene.add(house.root);
    const cam = new THREE.PerspectiveCamera(22, 1, 1, 400);

    let w = 0;
    let h = 0;
    let dirty = true;
    const ro = new ResizeObserver(([e]) => {
      w = Math.round(e.contentRect.width);
      h = Math.round(e.contentRect.height);
      if (w > 0 && h > 0) {
        renderer.setSize(w, h, false);
        tagEls.current.forEach((el) => el && (el.dataset.w = ''));
        dirty = true;
      }
    });
    ro.observe(stage);

    // pointer sway: target from the pointer, eased 5% per frame
    const target = { x: 0, y: 0 };
    const sway = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const b = stage.getBoundingClientRect();
      target.x = (e.clientX - b.left) / b.width - 0.5;
      target.y = (e.clientY - b.top) / b.height - 0.5;
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);

    const v = new THREE.Vector3();
    let last = -1;
    const off = onFrame(() => {
      if (!w || !h) return;
      const r = stage.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      sway.x += (target.x - sway.x) * 0.05;
      sway.y += (target.y - sway.y) * 0.05;
      const p = progress.current;
      const moving = Math.abs(target.x - sway.x) > 0.001 || Math.abs(target.y - sway.y) > 0.001;
      if (!dirty && !moving && Math.abs(p - last) < 0.00005) return;
      dirty = false;
      last = p;

      const { explode } = house.apply(p);
      placeCamera(cam, p, w / h, sway);
      renderer.render(scene, cam);

      // labels: fade in their window, pinned to the model, never on top of each other
      const placed: number[][] = [];
      labels.forEach((l, i) => {
        const el = tagEls.current[i];
        if (!el) return;
        const o = clamp((p - l.win[0]) / 0.3) * (1 - clamp((p - (l.win[1] - 0.25)) / 0.25));
        if (o <= 0.01) {
          if (el.style.opacity !== '0') el.style.opacity = '0';
          return;
        }
        v.set(...l.at);
        if (l.lift) v.y -= l.lift * (1 - explode);
        v.project(cam);
        const c = !!l.kind?.includes('c');
        if (!el.dataset.w) el.dataset.w = String(el.offsetWidth);
        const tw = Number(el.dataset.w);
        const x0 = (v.x * 0.5 + 0.5) * w;
        const y = (-v.y * 0.5 + 0.5) * h;
        const x = Math.max(c ? tw / 2 + 8 : 8, Math.min(w - (c ? tw / 2 : tw) - 8, x0));
        const bx = [c ? x - tw / 2 : x, y - 12, c ? x + tw / 2 : x + tw, y + 12];
        if (placed.some((q) => bx[0] < q[2] && bx[2] > q[0] && bx[1] < q[3] && bx[3] > q[1])) {
          el.style.opacity = '0';
          return;
        }
        placed.push(bx);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${c ? '-50%' : '0'}, -50%) translateY(${((1 - o) * 6).toFixed(1)}px)`;
      });
    });

    return () => {
      off();
      ro.disconnect();
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      house.dispose();
      renderer.dispose();
    };
  }, [labels, progress, onFail]);

  return (
    <div ref={box} className={s.stage}>
      <canvas ref={canvas} className={s.cv} />
      <div className={s.tags} aria-hidden="true">
        {labels.map((l, i) => (
          <div
            key={l.text}
            ref={(el) => {
              tagEls.current[i] = el;
            }}
            className={`${s.tag} ${(l.kind ?? []).map((k) => s[k]).join(' ')}`}
            style={{ opacity: 0 }}
          >
            {l.text}
            {l.sub && <b>{l.sub}</b>}
          </div>
        ))}
      </div>
    </div>
  );
}
