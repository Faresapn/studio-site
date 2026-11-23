import RevealText from '@/components/RevealText/RevealText';
import s from './SectionTitle.module.css';

export default function SectionTitle({ children, id }: { children: string; id?: string }) {
  return (
    <RevealText as="h2" className={s.sw}>
      <span id={id}>{children}</span>
    </RevealText>
  );
}
