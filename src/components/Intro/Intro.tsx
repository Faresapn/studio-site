import RevealText from '@/components/RevealText/RevealText';
import s from './Intro.module.css';

export default function Intro({ text }: { text: string }) {
  return (
    <RevealText as="p" className={s.intro}>
      {text}
    </RevealText>
  );
}
