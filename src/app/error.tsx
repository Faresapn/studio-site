'use client'; // error boundaries must be Client Components

import { useEffect } from 'react';
import Logo from '@/components/Logo/Logo';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import s from './not-found.module.css';

/**
 * Shown when one page fails to render (for example a CMS request that errors). Only that page is
 * replaced: the layout, menu and every other route keep working, and "Try again" re-renders the
 * segment without a full reload.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={s.nf}>
      <Logo />
      <h1>This page could not load.</h1>
      <div className={s.lks}>
        <button type="button" className="lk" onClick={() => retry()}>
          Try again
        </button>
        <TransitionLink className="lk" href="/">
          Back to home
        </TransitionLink>
      </div>
    </section>
  );
}
