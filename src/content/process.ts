import type { ProcessPage } from './types';
import { img } from './images';

export const processPage: ProcessPage = {
  label: 'Process',
  title: 'Six stages, from the first conversation to the last site visit.',
  heroImage: { src: img.d10, alt: '' },
  intro: {
    title: 'We talk first.',
    text: 'Most people expect a site visit at the start. We work the other way round. We meet, agree on the style and the concept, and put a quotation together from there. The site visit comes once we are working together. It keeps the first conversation about whether we are the right studio for your house, rather than about measurements.',
  },
  stagesLabel: 'Our six stages of process',
  stages: [
    {
      number: 1,
      title: 'Brief and Discovery',
      copy: 'We start by listening. Who lives in the house, how a normal day runs, what you love about the site and what worries you about it. We do not draw anything yet.',
      image: { src: img.pg1, alt: '' },
    },
    {
      number: 2,
      title: 'Concept and Design',
      copy: 'We come back with a direction. The plan, the massing, the feel of it. This is the stage where we find out whether we see the house the same way.',
      image: { src: img.pg2, alt: '' },
    },
    {
      number: 3,
      title: 'Design Development',
      copy: 'The design gets resolved. Layouts, materials, details, and drawings complete enough for a builder to price properly.',
      image: { src: img.pg3, alt: '' },
    },
    {
      number: 4,
      title: 'Budget Alignment',
      copy: 'We put the design against a real number and adjust until the two agree. Nothing goes out to a contractor before this is settled.',
      image: { src: img.pg4, alt: '' },
    },
    {
      number: 5,
      title: 'Vendor Coordination',
      copy: 'We bring in the contractor and consultants, walk them through the drawings and answer what comes up while they price the work.',
      image: { src: img.pg5, alt: '' },
    },
    {
      number: 6,
      title: 'Construction and Supervision',
      copy: 'We stay on site through the build, checking the work against the drawings and resolving what the drawings could not have anticipated.',
      image: { src: img.pg6, alt: '' },
    },
  ],
  build: {
    photo: { src: img.wabuild, alt: 'Completed house' },
    photoCaption: 'Completed house, as built',
    ariaLabel: 'A house taking shape, one stage at a time',
    labels: [
      { text: 'Site', sub: '28 × 20 m', at: [-14, 0, 11.6], win: [0, 1.05] },
      { text: 'Existing trees, kept', at: [12.4, 5.6, 6.8], win: [0.3, 1.05] },
      { text: 'Plan', at: [-9, 0, 4.6], win: [1.0, 1.55] },
      { text: '19.0 m', at: [-0.5, 0.05, 13.2], win: [3, 4.05], kind: ['c', 'a'] },
      { text: '11.0 m', at: [12.6, 0.05, -0.5], win: [3, 4.05], kind: ['c', 'a'] },
      { text: '9.0 m', at: [-13.4, 4.5, -6], win: [3, 4.05], kind: ['c', 'a'] },
      { text: 'Approx. 400 m²', sub: 'two floors', at: [0, 11.2, -0.5], win: [3.1, 4.05], kind: ['c', 'k'] },
      { text: 'Off-form concrete', sub: 'Concrete works', at: [-4.6, 16.2, 6.2], win: [4, 5.05], lift: 6.6 },
      { text: 'Timber screen', sub: 'Joinery', at: [9.6, 11, 5.4], win: [4.08, 5.05], lift: 3.4 },
      { text: 'Structure and glazing', sub: 'Main contractor', at: [7.6, 2.2, 4.6], win: [4.16, 5.05] },
      { text: 'Boundary and planting', sub: 'Landscape', at: [-12.6, 1.6, 12.6], win: [4.24, 5.05] },
    ],
  },
  outro: {
    text: 'That is how it works. If it sounds like the way you want to build, start here.',
    link: { label: 'Start a conversation', href: '/contact' },
  },
};
