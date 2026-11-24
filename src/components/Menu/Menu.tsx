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
import { getProject, projectHref } from '@/content/projects';
import { prefersReducedMotion } from '@/lib/motion';
import s from './Menu.module.css';

/** How long each photo stays in the menu panel before the next one slides in. */
const PHOTO_MS = 4000;

const sectionOf = (path: string) => (path.startsWith('/process') ? '/process' : '/');

/**
 * Full-screen menu. A photo panel on the left cross-fades to the hovered link's photos, which play in
 * turn while the menu is open: each new photo wipes in from the right and settles from a slight zoom
 * while the previous one is pushed left underneath. A photo of a project opens that project with the
 * shared-element motion. Links slide up with a stagger; socials fade in last. Escape, the scrim and the close strip close it. Focus is trapped
 * and scrolling locked while it is open.
 */
export default function Menu() {
  const open = useMenuOpen();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, open, '[data-close-btn]');

  useEffect(() => {
    lockScroll('menu', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // photos play in turn while the menu is open, starting from each item's first photo
  useEffect(() => {
    if (!open || prefersReducedMotion()) return;
    const id = window.setInterval(() => !document.hidden && setTick((n) => n + 1), PHOTO_MS);
    return () => {
      window.clearInterval(id);
      setTick(0);
    };
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
            const n = item.photos.length;
            const cur = tick % n;
            const out = tick > 0 ? (tick - 1) % n : -1;
            const photo = item.photos[cur];
            const name = photo.project ? getProject(photo.project)?.name : item.label;
            return (
              <TransitionLink
                key={item.href}
                href={photo.project ? projectHref(photo.project) : item.href}
                flipId={photo.project ? `menu-${photo.project}` : undefined}
                className={`${s.photo} ${shown === item.href ? s.on : ''}`}
                aria-label={`Open ${name}`}
                tabIndex={shown === item.href ? 0 : -1}
              >
                {item.photos.map((ph, i) => (
                  <span
                    key={i}
                    className={`${s.box} ${i === cur ? s.sh : i === out && n > 1 ? s.out : ''}`}
                    data-flip-src={i === cur ? '' : undefined}
                  >
                    <Image
                      src={ph.image.src}
                      alt=""
                      fill
                      sizes="(max-width: 1099px) 40vw, 22vw"
                      placeholder="blur"
                    />
                  </span>
                ))}
              </TransitionLink>
            );
          })}
        </div>

        <div className={s.rt}>
          <TransitionLink href="/" className={s.logo} aria-label={`LOGO, ${site.name} home`}>
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
