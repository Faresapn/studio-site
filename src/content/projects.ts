import type { Project } from './types';
import { img } from './images';

const placeholder = [
  'Placeholder description. A short paragraph about the site, the brief and the idea the house grew from will sit here once the studio supplies project copy.',
  'A second paragraph can cover materials, light and how the rooms open to the garden. Photographs below are the ones the prototype attributes to this house.',
];

/** One entry per placeholder project. Galleries reuse the prototype photos credited to each house. */
export const projects: Project[] = [
  {
    slug: 'house-a',
    name: 'House A',
    category: 'Residential',
    year: 2024,
    location: 'City',
    cover: { src: img.hero1, alt: 'House A living room and stair' },
    gallery: [
      { src: img.hero3, alt: 'House A living room opening onto the pool' },
      { src: img.stair, alt: 'House A stair' },
      { src: img.facade, alt: 'House A facade' },
      { src: img.rcbed, alt: 'House A bedroom' },
    ],
    description: placeholder,
    order: 1,
  },
  {
    slug: 'house-b',
    name: 'House B',
    category: 'Residential',
    year: 2025,
    location: 'City',
    cover: { src: img.hero2, alt: 'Entrance with breeze-block screen' },
    gallery: [
      { src: img.entrance, alt: 'House B entrance' },
      { src: img.kitchen, alt: 'House B kitchen' },
      { src: img.rkcourt, alt: 'House B courtyard' },
    ],
    description: placeholder,
    order: 2,
  },
  {
    slug: 'house-c',
    name: 'House C',
    category: 'Residential',
    year: 2025,
    location: 'City',
    cover: { src: img.living, alt: 'House C living room' },
    gallery: [{ src: img.living, alt: 'House C living room' }],
    description: placeholder,
    order: 3,
  },
  {
    slug: 'house-d',
    name: 'House D',
    category: 'Residential',
    year: 2025,
    location: 'City',
    cover: { src: img.exterior, alt: 'House D exterior' },
    gallery: [{ src: img.exterior, alt: 'House D exterior' }],
    description: placeholder,
    order: 4,
  },
  {
    slug: 'house-e',
    name: 'House E',
    category: 'Residential',
    year: 2025,
    location: 'City',
    cover: { src: img.ivliving, alt: 'House E living room' },
    gallery: [
      { src: img.ivliving, alt: 'House E living room' },
      { src: img.ivbed, alt: 'House E bedroom' },
    ],
    description: placeholder,
    order: 5,
  },
].sort((a, b) => a.order - b.order);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** The project after this one, wrapping round to the first. */
export function getNextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}

export const projectHref = (slug: string) => `/projects/${slug}`;
