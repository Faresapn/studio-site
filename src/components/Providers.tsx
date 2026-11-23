'use client';

import { Fragment, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useLenis } from '@/hooks/useLenis';
import PageTransition from '@/components/PageTransition/PageTransition';
import MenuTab from '@/components/MenuTab/MenuTab';
import Menu from '@/components/Menu/Menu';
import RefreshButton from '@/components/RefreshButton/RefreshButton';
import Loader from '@/components/Loader/Loader';
import { useReplayCount } from '@/lib/replay';

/** Client shell that persists across routes: smooth scroll, menu, page transition wrapper. */
export default function Providers({ children }: { children: ReactNode }) {
  useLenis();
  const pathname = usePathname();
  const replay = useReplayCount();
  return (
    <>
      {/* first visit on Home, or a replay from the Refresh button; the key restarts its CSS sequence */}
      {(pathname === '/' || replay > 0) && <Loader key={replay} />}
      <MenuTab />
      <Menu />
      <PageTransition>
        {/* remount the page on replay so the hero intro and slider start over under the loader */}
        <Fragment key={replay}>{children}</Fragment>
      </PageTransition>
      <RefreshButton />
    </>
  );
}
