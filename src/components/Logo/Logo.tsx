import TransitionLink from '@/components/PageTransition/TransitionLink';
import LogoMark from '@/components/icons/LogoMark';
import { site } from '@/content/site';
import s from './Logo.module.css';

/** The LOGO placeholder, top left of every page. `light` for pages that open on a photo. */
export default function Logo({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <TransitionLink
      href="/"
      className={`${s.logo} ${light ? s.light : ''} ${className}`}
      aria-label={`LOGO, ${site.name} home`}
    >
      <LogoMark title="" aria-hidden="true" />
    </TransitionLink>
  );
}
