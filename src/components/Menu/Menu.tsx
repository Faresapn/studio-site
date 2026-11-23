'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import LogoMark from '@/components/icons/LogoMark';
import { setMenuOpen, useMenuOpen } from '@/lib/menu';
import { lockScroll } from '@/lib/scroll';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { site } from '@/content/site';
import { projectHref } from '@/content/projects';
import s from './Menu.module.css';

/** Where each menu photo leads: the Home photo is House A's cover, so it opens that project. */
const PHOTO_LINKS: Record<string, { href: string; label: string; flipId?: string }> = {
  '/': { href: projectHref('house-a'), label: 'House A', flipId: 'menu-house-a' },
  '/process': { href: '/process', label: 'Process' },
};

const sectionOf = (path: string) => (path.startsWith('/process') ? '/process' : '/');

/**
 * Full-screen menu. A photo panel on the left cross-fades to the hovered link's photo; links slide up
 * with a stagger; socials fade in last. Escape, the scrim and the close strip close it. Focus is trapped
 * and scrolling locked while it is open.
 */
export default function Menu() {
  const open = useMenuOpen();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, open, '[data-close-btn]');

  useEffect(() => {
    lockScroll('menu', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const shown = hovered ?? sectionOf(pathname);
  const close = () => setMenuOpen(false);

  return (
    <div id="menu" className={`${s.menu} ${open ? s.open : ''}`} aria-hidden={!open} inert={!open}>
      <div className={s.scrim} onClick={close} />
      <div className={s.pn} ref={panel} role="dialog" aria-modal="true" aria-label="Menu">
        <div className={s.strip}>
          <button type="button" data-close-btn aria-label="Close menu" onClick={close} />
        </div>

        <div className={s.ph} data-lenis-prevent>
          {site.nav.map((item) => {
            const link = PHOTO_LINKS[item.href];
            return (
              <TransitionLink
                key={item.href}
                href={link.href}
                flipId={link.flipId}
                className={`${s.photo} ${shown === item.href ? s.on : ''}`}
                aria-label={`Open ${link.label}`}
                tabIndex={shown === item.href ? 0 : -1}
              >
                <span className={s.box} data-flip-src>
                  <Image src={item.image.src} alt="" fill sizes="(max-width: 1099px) 40vw, 22vw" placeholder="blur" />
                </span>
              </TransitionLink>
            );
          })}
        </div>

        <div className={s.rt}>
          <TransitionLink href="/" className={s.logo} aria-label={`${site.name} home`}>
            <LogoMark title="" aria-hidden="true" />
          </TransitionLink>
          <nav className={s.nav} aria-label="Main" onMouseLeave={() => setHovered(null)}>
            {site.nav.map((item) => (
              <TransitionLink
                key={item.href}
                href={item.href}
                className={pathname === item.href ? s.cur : ''}
                aria-current={pathname === item.href ? 'page' : undefined}
                onMouseEnter={() => setHovered(item.href)}
                onFocus={() => setHovered(item.href)}
              >
                <span>{item.label}</span>
              </TransitionLink>
            ))}
          </nav>
          <div className={s.so}>
            {site.socials.map((l) => (
              <TransitionLink key={l.label} href={l.href}>
                {l.label}
              </TransitionLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
