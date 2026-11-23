import type { ElementType, ReactNode } from 'react';

type Props = { as?: ElementType; className?: string; children: ReactNode };

/** Text block that fades and rises once it is a third of the way up the screen (see useReveal). */
export default function RevealText({ as: Tag = 'div', className = '', children }: Props) {
  return <Tag className={`rv ${className}`}>{children}</Tag>;
}
