import Image from 'next/image';
import TransitionLink from '@/components/PageTransition/TransitionLink';
import { projectHref } from '@/content/projects';
import type { Project } from '@/content/types';
import s from './NextProject.module.css';

/** Closing block of a project page. Its photo is the shared element into the next project's hero. */
export default function NextProject({ project }: { project: Project }) {
  return (
    <TransitionLink href={projectHref(project.slug)} flipId={`next-${project.slug}`} className={s.nx}>
      <span className={s.im} data-flip-src>
        <Image src={project.cover.src} alt="" fill sizes="100vw" placeholder="blur" />
      </span>
      <span className={`${s.tx} rv`}>
        <span className={s.lab}>Next project</span>
        <span className={s.nn}>
          {project.name}
          <svg viewBox="0 0 26 10" aria-hidden="true">
            <path d="M0 5h25M21 1l4 4-4 4" fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke" />
          </svg>
        </span>
        <span className={s.mt}>
          {project.category} · {project.year}
        </span>
      </span>
    </TransitionLink>
  );
}
