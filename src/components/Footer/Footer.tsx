import TransitionLink from '@/components/PageTransition/TransitionLink';
import KletosMark from '@/components/icons/KletosMark';
import { site } from '@/content/site';
import BackToTop from './BackToTop';
import s from './Footer.module.css';

export default function Footer() {
  const a = site.appointment;
  return (
    <footer className={s.foot} data-stagger>
      <div className={s.r1}>
        <div>
          <div className={s.city}>{site.city}</div>
          <address className={s.addr}>{site.address}</address>
          <TransitionLink className={s.appt} href={a.href}>
            <span>{a.lead}</span>
            <span className={s.o}>{a.rest}</span>
            <span className={s.x}>{a.hover}</span>
          </TransitionLink>
        </div>
        <div className={s.soc}>
          {site.socials.map((l) => (
            <TransitionLink key={l.label} className="lk" href={l.href}>
              {l.label}
            </TransitionLink>
          ))}
        </div>
      </div>
      <div className={s.r2}>
        <span className={s.cp}>{site.copyright}</span>
        <BackToTop className="lk" />
        <span className={s.by}>
          {site.credit.label}{' '}
          <TransitionLink className={s.hok} href={site.credit.href} aria-label={site.credit.studio}>
            <KletosMark title="" aria-hidden="true" />
          </TransitionLink>
        </span>
      </div>
    </footer>
  );
}
