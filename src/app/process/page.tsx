import type { Metadata } from 'next';
import Image from 'next/image';
import Logo from '@/components/Logo/Logo';
import Footer from '@/components/Footer/Footer';
import RevealScope from '@/components/RevealScope';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import ProcessStages from '@/components/ProcessStages/ProcessStages';
import { processPage as p } from '@/content/process';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Process', description: p.title };

/**
 * Process: the hero with "We talk first", then the pinned six-stage section where a line drawing of a
 * house builds itself as you scroll (a Remotion composition seeked by scroll), then the outro.
 */
export default function ProcessPage() {
  return (
    <RevealScope>
      <section className={s.pr1}>
        <Logo light />
        <Image
          className={s.bg}
          src={p.heroImage.src}
          alt={p.heroImage.alt}
          fill
          sizes="100vw"
          preload
          placeholder="blur"
        />
        <div className={s.tl}>
          <div className={s.lab}>{p.label}</div>
          <h1>{p.title}</h1>
        </div>
        <div className={s.br}>
          <h2>{p.intro.title}</h2>
          <p>{p.intro.text}</p>
        </div>
      </section>

      <ProcessStages page={p} />

      <section className={`${s.pr3} rv`}>
        <p>{p.outro.text}</p>
        <TransitionLink className="lk" href={p.outro.link.href}>
          {p.outro.link.label}
        </TransitionLink>
      </section>
      <Footer />
    </RevealScope>
  );
}
