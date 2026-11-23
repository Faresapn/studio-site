/**
 * Content types. Each top-level type maps one to one onto a Sanity document
 * (see README → "Planned CMS"), so swapping the local files for GROQ queries
 * only changes the data layer, not the components.
 */
import type { StaticImageData } from 'next/image';

/** An image plus its alt text. In Sanity this becomes an `image` field with an `alt` sub-field. */
export type Media = {
  src: StaticImageData;
  alt: string;
};

export type Link = {
  label: string;
  href: string;
};

/** sanity: document `siteSettings` (singleton) */
export type SiteSettings = {
  name: string;
  city: string;
  address: string;
  /** "By appointment only" swaps to "By appointment · Contact us" on hover. */
  appointment: { lead: string; rest: string; hover: string; href: string };
  socials: Link[];
  copyright: string;
  credit: { label: string; studio: string; href: string };
  nav: (Link & { image: Media })[];
};

/** sanity: document `project` */
export type Project = {
  slug: string;
  name: string;
  category: string;
  year: number;
  location: string;
  cover: Media;
  gallery: Media[];
  description: string[];
  order: number;
};

/** A hero slide references a project; the headline is written for the slide, not the project. */
export type HeroSlide = {
  project: string; // project slug (a reference in Sanity)
  image: Media;
  headline: [string, string];
  meta: string;
};

/** A card in a works grid references a project and picks one of its photos. */
export type WorkCard = {
  project: string; // project slug
  image: Media;
  name: string;
  category: string;
  year: number;
  wide?: boolean;
};

/** sanity: document `homePage` (singleton) */
export type HomePage = {
  hero: { slides: HeroSlide[]; seeLabel: string; nextLabel: string };
  intro: string;
  worksTitle: string;
  gridA: WorkCard[];
  band: { image: Media; title: string; text: string; link: Link };
  gridB: WorkCard[];
  cta: { title: string; text: string; link: Link };
};

/** sanity: document `processStage` (ordered) */
export type ProcessStage = {
  number: number;
  title: string;
  copy: string;
  image: Media;
};

/** A label pinned to a point in the 3D house; shown while the build progress is inside `win` (0-6). */
export type SceneLabel = {
  text: string;
  sub?: string;
  at: [number, number, number];
  win: [number, number];
  /** 'c' centred dimension, 'a' accent colour, 'k' large serif */
  kind?: string[];
  /** model units the point drops by while the house is closed (labels on lifted trades) */
  lift?: number;
};

export type ProcessPage = {
  label: string;
  title: string;
  heroImage: Media;
  intro: { title: string; text: string };
  stagesLabel: string;
  stages: ProcessStage[];
  build: { photo: Media; photoCaption: string; drawings: string[]; labels: SceneLabel[]; ariaLabel: string };
  outro: { text: string; link: Link };
};
