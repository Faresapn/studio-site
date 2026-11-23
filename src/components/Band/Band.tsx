import ParallaxImage from '@/components/ParallaxImage/ParallaxImage';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import type { HomePage } from '@/content/types';
import s from './Band.module.css';

/** Full-width photo band. The whole band leads to Process; the link inside is the visible affordance. */
export default function Band({ band }: { band: HomePage['band'] }) {
  return (
    <section className={s.band} aria-labelledby="band-title">
      <TransitionLink href={band.link.href} className={s.cover} tabIndex={-1} aria-hidden="true">
        <ParallaxImage src={band.image.src} alt={band.image.alt} />
      </TransitionLink>
      <div className={`${s.in} rv`}>
        <h2 id="band-title">{band.title}</h2>
        <p>{band.text}</p>
        <TransitionLink className="lk lt" href={band.link.href}>
          {band.link.label}
        </TransitionLink>
      </div>
    </section>
  );
}
