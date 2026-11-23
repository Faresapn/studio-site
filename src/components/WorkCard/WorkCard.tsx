import Image from 'next/image';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import { projectHref } from '@/content/projects';
import type { WorkCard as Card } from '@/content/types';
import s from './WorkCard.module.css';

type Props = { card: Card; flipId: string };

/**
 * Project card. The photo is the shared element: clicking flies it into the project page hero.
 * `data-rc` arms the card reveal (photo unmasks, caption follows); `data-d` marks the staggered parts.
 */
export default function WorkCard({ card, flipId }: Props) {
  return (
    <TransitionLink
      href={projectHref(card.project)}
      flipId={flipId}
      className={`${s.card} ${card.wide ? s.wide : ''}`}
      data-rc=""
    >
      <div className={s.im} data-flip-src data-d="im">
        <Image
          src={card.image.src}
          alt={card.image.alt}
          fill
          placeholder="blur"
          data-d="im"
          sizes={
            card.wide
              ? '(max-width: 1099px) calc(100vw - 40px), 50vw'
              : '(max-width: 560px) calc(100vw - 40px), (max-width: 1099px) 50vw, 25vw'
          }
        />
      </div>
      <h3 className={s.title} data-d="tx">
        <span>{card.name}</span>
      </h3>
      <div className={s.mt} data-d="tx">
        <span>{card.category}</span>
        <i aria-hidden="true" />
        <span>{card.year}</span>
      </div>
    </TransitionLink>
  );
}
