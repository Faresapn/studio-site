import Logo from '@/components/Logo/Logo';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import s from './not-found.module.css';

export default function NotFound() {
  return (
    <section className={s.nf}>
      <Logo />
      <h1>This page does not exist.</h1>
      <TransitionLink className="lk" href="/">
        Back to home
      </TransitionLink>
    </section>
  );
}
