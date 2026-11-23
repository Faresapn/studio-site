'use client';

import { useEffect, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { onFrame } from '@/lib/motion';
import type { SceneLabel } from '@/content/types';
import { DURATION, FPS, HouseComposition, PER_STAGE } from './HouseComposition';
import s from './ProcessBuild.module.css';

type Props = {
  labels: SceneLabel[];
  /** Build progress 0..6, written by the scroll handler of the Process section. */
  progress: { current: number };
};

/**
 * The Remotion Player, driven by scroll instead of time: it never plays, it only seeks to the frame that
 * matches the current progress. The composition is sized to the panel so nothing is letterboxed.
 * Loaded with next/dynamic, so Remotion and Three never ship to pages without the Process build.
 */
export default function ProcessBuild({ labels, progress }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      if (w > 0 && h > 0) setSize((cur) => (cur && cur.w === w && cur.h === h ? cur : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!size) return;
    let last = -1;
    return onFrame(() => {
      const f = Math.round(progress.current * PER_STAGE);
      if (f === last || !player.current) return;
      last = f;
      player.current.seekTo(f);
    });
  }, [size, progress]);

  return (
    <div ref={box} className={s.stage}>
      {size && (
        <Player
          ref={player}
          component={HouseComposition}
          inputProps={{ labels }}
          durationInFrames={DURATION}
          fps={FPS}
          compositionWidth={size.w}
          compositionHeight={size.h}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          initialFrame={Math.round(progress.current * PER_STAGE)}
        />
      )}
    </div>
  );
}
