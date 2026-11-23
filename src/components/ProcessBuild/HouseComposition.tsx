'use client';

import { useEffect, useLayoutEffect, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneLabel } from '@/content/types';
import { clamp, createHouse, placeCamera, seg, type HouseScene } from './scene';
import s from './ProcessBuild.module.css';

/** 90 frames per stage at 30 fps: frame / 90 is the build progress p (0..6). */
export const FPS = 30;
export const PER_STAGE = 90;
export const STAGES = 6;
export const DURATION = PER_STAGE * STAGES + 1;

export type HouseProps = { labels: SceneLabel[] };

/** Applies progress p to the scene and camera, then asks R3F for exactly one new frame. */
function Scene({ house, p, aspect }: { house: HouseScene; p: number; aspect: number }) {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((st) => st.invalidate);
  useLayoutEffect(() => {
    house.apply(p);
    placeCamera(camera, p, aspect);
    invalidate();
  }, [house, p, aspect, camera, invalidate]);
  return (
    <>
      {/* the paper colour shifts to dusk at the end; attached as the scene background */}
      <primitive object={house.background} attach="background" />
      <primitive object={house.root} />
    </>
  );
}

/**
 * The Remotion composition: one frame per scroll position. The 3D house is drawn by @remotion/three;
 * the labels are HTML on top, projected with the same camera so they stay pinned to the model.
 */
export function HouseComposition({ labels }: HouseProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = Math.min(STAGES, frame / PER_STAGE);
  const aspect = width / height;
  const house = useMemo(() => createHouse(), []);
  useEffect(() => () => house.dispose(), [house]);

  const tags = useMemo(() => {
    const cam = new THREE.PerspectiveCamera();
    placeCamera(cam, p, aspect);
    const explode = seg(p, 4.05, 4.6) * (1 - seg(p, 5.0, 5.45));
    const v = new THREE.Vector3();
    return labels.map((l) => {
      const o = clamp((p - l.win[0]) / 0.3) * (1 - clamp((p - (l.win[1] - 0.25)) / 0.25));
      v.set(...l.at);
      if (l.lift) v.y -= l.lift * (1 - explode);
      v.project(cam);
      const centred = l.kind?.includes('c');
      const x = clamp((v.x * 0.5 + 0.5) * width, 8, width - 8);
      const y = (-v.y * 0.5 + 0.5) * height;
      return { l, o, x, y, centred };
    });
  }, [labels, p, aspect, width, height]);

  return (
    <AbsoluteFill>
      <ThreeCanvas
        width={width}
        height={height}
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        frameloop="demand"
        gl={{ antialias: true }}
        camera={{ fov: 22, near: 1, far: 400 }}
      >
        <Scene house={house} p={p} aspect={aspect} />
      </ThreeCanvas>
      <div className={s.tags} aria-hidden="true">
        {tags.map(({ l, o, x, y, centred }) =>
          o <= 0.01 ? null : (
            <div
              key={l.text}
              className={`${s.tag} ${(l.kind ?? []).map((k) => s[k]).join(' ')}`}
              style={{
                opacity: o,
                transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${centred ? '-50%' : '0'}, -50%) translateY(${((1 - o) * 6).toFixed(1)}px)`,
              }}
            >
              {l.text}
              {l.sub && <b>{l.sub}</b>}
            </div>
          ),
        )}
      </div>
    </AbsoluteFill>
  );
}
