'use client';

import type { ReactNode } from 'react';
import { useLenis } from '@/hooks/useLenis';
import PageTransition from '@/components/PageTransition/PageTransition';
import MenuTab from '@/components/MenuTab/MenuTab';
import Menu from '@/components/Menu/Menu';
import RefreshButton from '@/components/RefreshButton/RefreshButton';

/** Client shell that persists across routes: smooth scroll, menu, page transition wrapper. */
export default function Providers({ children }: { children: ReactNode }) {
  useLenis();
  return (
    <>
      <MenuTab />
      <Menu />
      <PageTransition>{children}</PageTransition>
      <RefreshButton />
    </>
  );
}
