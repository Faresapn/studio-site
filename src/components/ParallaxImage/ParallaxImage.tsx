'use client';

import Image, { type StaticImageData } from 'next/image';
import { useEffect, useRef } from 'react';
import { isDesktop, onFrame, prefersReducedMotion } from '@/lib/motion';

type Props = {
  src: StaticImageData;
  alt: string;
  className?: string;
  /** Total drift in % of the image height across one viewport of scroll (negative = up). */
  amount?: number;
  sizes?: string;
};

/**
 * Background image that drifts with scroll (desktop only, as in the prototype's band). The position is
 * read from the container's layout, never from the moved image, and eased 12% per frame so it glides.
 */
export default function ParallaxImage({ src, alt, className, amount = -9, sizes = '100vw' }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cur = 0;
    const tick = () => {
      const b = box.current;
      const i = img.current;
      if (!b || !i) return;
      if (!isDesktop()) {
        if (cur !== 0) i.style.transform = '';
        cur = 0;
        return;
      }
      const r = b.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top > vh || r.bottom < 0) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      cur += (p * amount - cur) * 0.12;
      i.style.transform = `translate3d(0, ${cur.toFixed(3)}%, 0)`;
    };
    return onFrame(tick);
  }, [amount]);

  return (
    <div ref={box} className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        ref={img}
        style={{ position: 'absolute', left: 0, top: '-12%', width: '100%', height: '124%', willChange: 'transform' }}
      >
        <Image src={src} alt={alt} fill sizes={sizes} placeholder="blur" style={{ objectFit: 'cover' }} />
      </div>
    </div>
  );
}
