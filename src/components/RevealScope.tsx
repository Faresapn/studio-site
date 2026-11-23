'use client';

import { useRef, type ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';

/** Wraps a page's content so server-rendered sections get the reveal-on-scroll behaviour. */
export default function RevealScope({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
