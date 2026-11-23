import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectHero from '@/components/ProjectHero/ProjectHero';
import Gallery from '@/components/Gallery/Gallery';
import NextProject from '@/components/NextProject/NextProject';
import Footer from '@/components/Footer/Footer';
import RevealScope from '@/components/RevealScope';
import { getNextProject, getProject, projects } from '@/content/projects';
import s from './page.module.css';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.description[0],
    openGraph: {
      images: [{ url: project.cover.src.src, width: project.cover.src.width, height: project.cover.src.height }],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const next = getNextProject(slug);
  const [lead, ...rest] = project.description;

  return (
    <RevealScope>
      <ProjectHero project={project} />

      <section className={s.info} aria-label="About the project">
        <dl className={`${s.facts} rv`}>
          <div>
            <dt className={s.lab}>Category</dt>
            <dd className={s.val}>{project.category}</dd>
          </div>
          <div>
            <dt className={s.lab}>Year</dt>
            <dd className={s.val}>{project.year}</dd>
          </div>
          <div>
            <dt className={s.lab}>Location</dt>
            <dd className={s.val}>{project.location}</dd>
          </div>
          <div>
            <dt className={s.lab}>Photos</dt>
            <dd className={s.val}>{project.gallery.length}</dd>
          </div>
        </dl>
        <div className={`${s.ab} rv`}>
          <p className={s.lead}>{lead}</p>
          {rest.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section aria-label={`${project.name} photographs`}>
        <Gallery images={project.gallery} title={project.name} />
      </section>

      <NextProject project={next} />
      <Footer />
    </RevealScope>
  );
}
