import type { HomePage, WorkCard } from './types';
import { img } from './images';

const card = (project: string, key: keyof typeof img, name: string, alt: string, wide = false): WorkCard => ({
  project,
  image: { src: img[key], alt },
  name,
  // The prototype prints "Residential · 2025" under every card, whatever the hero says.
  category: 'Residential',
  year: 2025,
  wide,
});

export const home: HomePage = {
  hero: {
    seeLabel: 'See project',
    nextLabel: 'Next project',
    dotsLabel: 'Choose a project',
    slides: [
      {
        project: 'house-a',
        image: { src: img.hero1, alt: 'House A living room and stair' },
        headline: ['Homes shaped by light, air and', 'the nature around them'],
        meta: 'Residential · 2024',
      },
      {
        project: 'house-b',
        image: { src: img.hero2, alt: 'Entrance with breeze-block screen' },
        headline: ['Few projects.', 'Each one seen through to the end.'],
        meta: 'Residential · 2025',
      },
      {
        project: 'house-a',
        image: { src: img.hero3, alt: 'House A living room opening onto the pool' },
        headline: ['The person you meet first', 'is the one who draws your house.'],
        meta: 'Residential · 2024',
      },
    ],
  },
  intro:
    'Studio Name is a residential architecture practice in City, established in 2017. We design each house from the first conversation through to construction.',
  worksTitle: 'Selected Works',
  gridA: [
    card('house-a', 'stair', 'House A', 'House A stair'),
    card('house-b', 'entrance', 'House B', 'House B entrance'),
    card('house-b', 'kitchen', 'House B', 'House B kitchen', true),
    card('house-c', 'living', 'House C', 'House C living room'),
    card('house-d', 'exterior', 'House D', 'House D exterior'),
    card('house-e', 'ivliving', 'House E', 'House E living room'),
    card('house-a', 'rcbed', 'House A', 'House A bedroom'),
  ],
  band: {
    image: { src: img.band, alt: '' },
    title: 'How we work',
    text: 'Every project starts with a conversation. We agree on the direction first. Everything after that follows from it.',
    link: { label: 'See our process', href: '/process' },
  },
  gridB: [
    card('house-a', 'facade', 'House A', 'House A facade', true),
    card('house-b', 'rkcourt', 'House B', 'House B courtyard'),
    card('house-e', 'ivbed', 'House E', 'House E bedroom'),
  ],
  cta: {
    title: 'Have a site in mind?',
    text: 'Tell us where it is and what you are imagining. We will take it from there.',
    link: { label: 'Start a conversation', href: '/contact' },
  },
};

/** Photos that wipe up inside the loader frame before the hero opens. */
export const loaderImages = [img.load1, img.load2, img.load3];
