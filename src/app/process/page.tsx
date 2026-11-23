import type { Metadata } from 'next';
import Image from 'next/image';
import Logo from '@/components/Logo/Logo';
import Footer from '@/components/Footer/Footer';
import RevealScope from '@/components/RevealScope';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import { processPage as p } from '@/content/process';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Process', description: p.title };

/**
 * Process, card version: the hero, the "We talk first" intro and the six stages as cards.
 * (The prototype builds a Three.js drawing of a house across the stages; see README → Deviations.)
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

      <section className={s.pr2} aria-labelledby="stages-title">
        <h2 id="stages-title" className={`${s.lab} rv`}>
          {p.stagesLabel}
        </h2>
        <ol className={s.stages} data-grid>
          {p.stages.map((st) => (
            <li key={st.number} className={s.stg} data-rc="">
              <span className={s.ph} data-d="im">
                <Image
                  src={st.image.src}
                  alt={st.image.alt}
                  fill
                  sizes="(max-width: 1099px) 100vw, 30vw"
                  placeholder="blur"
                  data-d="im"
                />
              </span>
              <span className={s.no} aria-hidden="true" data-d="tx">
                {st.number}
              </span>
              <div className={s.bt} data-d="tx">
                <h3>{st.title}</h3>
                <p>{st.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

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
