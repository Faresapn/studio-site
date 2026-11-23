import TransitionLink from '@/components/PageTransition/TransitionLink';
import type { Link } from '@/content/types';
import s from './Cta.module.css';

type Props = { title: string; text: string; link: Link };

export default function Cta({ title, text, link }: Props) {
  return (
    <section className={`${s.cta} rv`}>
      <h2>{title}</h2>
      <p>{text}</p>
      <TransitionLink className="lk" href={link.href}>
        {link.label}
      </TransitionLink>
    </section>
  );
}
