import type { Metadata } from 'next';
import Image from 'next/image';
import Logo from '@/components/Logo/Logo';
import Footer from '@/components/Footer/Footer';
import RevealScope from '@/components/RevealScope';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import { site } from '@/content/site';
import { img } from '@/content/images';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Contact', description: `Contact ${site.name}, ${site.city}.` };

/**
 * Placeholder contact page. It exists so every "Contact us", "Start a conversation" and social label
 * leads somewhere; the real enquiry form (server action + spam protection) is listed under next steps.
 */
export default function ContactPage() {
  return (
    <RevealScope>
      <div className={s.ct}>
        <div className={s.im}>
          <Logo light />
          <Image src={img.entrance} alt="" fill sizes="(max-width: 1099px) 100vw, 40vw" preload placeholder="blur" />
        </div>
        <div className={s.rt}>
          <h1>Contact</h1>
          <div className={s.inf}>
            <div className={s.lab}>Studio</div>
            <p className={s.val}>{site.name}</p>
            <p className={s.val}>{site.address}</p>
            <p className={s.note}>
              {site.appointment.lead}
              {site.appointment.rest}
            </p>
          </div>
          <div className={s.three}>
            {site.socials.map((l) => (
              <div key={l.label}>
                <div className={s.lab}>{l.label}</div>
                <p className={s.val}>Placeholder</p>
              </div>
            ))}
          </div>
          <hr />
          <p className={s.lead}>Tell us where it is and what you are imagining. We will take it from there.</p>
          <p className={s.note}>The enquiry form is not part of this build yet. It will sit here.</p>
          <div className={s.back}>
            <TransitionLink className="lk" href="/">
              Back to home
            </TransitionLink>
            <TransitionLink className="lk" href="/process">
              See our process
            </TransitionLink>
          </div>
        </div>
      </div>
      <Footer />
    </RevealScope>
  );
}
