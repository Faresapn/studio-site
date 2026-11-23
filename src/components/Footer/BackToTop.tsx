'use client';

import { getLenis } from '@/lib/scroll';
import { prefersReducedMotion } from '@/lib/motion';

export default function BackToTop({ className }: { className?: string }) {
  return (
    <a
      href="#main"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: 1.4 });
        else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        document.getElementById('main')?.focus({ preventScroll: true });
      }}
    >
      Back to top
    </a>
  );
}
