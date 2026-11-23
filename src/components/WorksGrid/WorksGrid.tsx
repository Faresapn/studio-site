import WorkCard from '@/components/WorkCard/WorkCard';
import type { WorkCard as Card } from '@/content/types';
import s from './WorksGrid.module.css';

type Props = { cards: Card[]; id: string; spaced?: boolean };

/** Four-column grid on desktop (wide cards span two), two below 1100px, one below 560px. */
export default function WorksGrid({ cards, id, spaced = false }: Props) {
  return (
    <div className={`${s.grid} ${spaced ? s.spaced : ''}`} data-grid>
      {cards.map((card, i) => (
        <WorkCard key={`${card.project}-${i}`} card={card} flipId={`${id}-${i}`} />
      ))}
    </div>
  );
}
