'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import Lightbox from '@/components/Lightbox/Lightbox';
import type { Media } from '@/content/types';
import s from './Gallery.module.css';

/**
 * Project photos. Every third photo runs wide. Same reveal and hover zoom as the home cards;
 * each photo opens the lightbox, which grows out of the clicked thumbnail.
 */
export default function Gallery({ images, title }: { images: Media[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <>
      <div className={s.grid} data-grid>
        {images.map((m, i) => {
          const wide = i % 3 === 0;
          return (
            <button
              key={i}
              type="button"
              ref={(el) => {
                thumbs.current[i] = el;
              }}
              className={`${s.item} ${wide ? s.wide : ''}`}
              onClick={() => setOpen(i)}
              aria-label={`Open photo ${i + 1} of ${images.length}: ${m.alt}`}
              data-rc=""
            >
              <span className={s.im} data-d="im">
                <Image
                  src={m.src}
                  alt={m.alt}
                  fill
                  placeholder="blur"
                  data-d="im"
                  sizes={
                    wide
                      ? '(max-width: 1099px) calc(100vw - 40px), 90vw'
                      : '(max-width: 699px) calc(100vw - 40px), 45vw'
                  }
                />
              </span>
            </button>
          );
        })}
      </div>
      {open !== null && (
        <Lightbox
          images={images}
          start={open}
          title={title}
          thumbFor={(i) => thumbs.current[i]?.querySelector('span') ?? null}
          onClosed={() => setOpen(null)}
        />
      )}
    </>
  );
}
