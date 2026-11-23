'use client';

import Link from 'next/link';
import { useRef, type ComponentProps } from 'react';
import { navigate } from '@/lib/transition';

type Props = Omit<ComponentProps<typeof Link>, 'href' | 'onNavigate'> & {
  href: string;
  /** Shared-element id. The element inside the link marked `data-flip-src` flies to the destination's hero. */
  flipId?: string;
  /** Selector for a flip source outside the link (e.g. "See project" flies the current hero slide). */
  flipFrom?: string;
};

/**
 * A real <a href> (works without JS, opens in a new tab with modifier keys) whose client-side navigation
 * is handed to the transition controller instead of swapping the page instantly.
 */
export default function TransitionLink({ href, flipId, flipFrom, onClick, ...rest }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <Link
      ref={ref}
      href={href}
      scroll={false}
      data-flip-id={flipId}
      onClick={onClick}
      onNavigate={(e) => {
        e.preventDefault();
        const flipEl = !flipId
          ? null
          : flipFrom
            ? document.querySelector<HTMLElement>(flipFrom)
            : ref.current?.querySelector<HTMLElement>('[data-flip-src]');
        void navigate(href, { flipEl, flipId });
      }}
      {...rest}
    />
  );
}
