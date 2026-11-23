import type { SiteSettings } from './types';
import { img } from './images';

/** Placeholders kept exactly as in the prototype. */
export const site: SiteSettings = {
  name: 'Studio Name',
  city: 'City',
  address: 'Street address, City, Postcode',
  appointment: { lead: 'By appointment', rest: ' only', hover: '  •  Contact us', href: '/contact' },
  socials: [
    { label: 'Instagram', href: '/contact' },
    { label: 'Whatsapp', href: '/contact' },
    { label: 'Email', href: '/contact' },
  ],
  copyright: '© Studio Name  2026',
  credit: { label: 'Website by', studio: 'House of Kletos', href: '/contact' },
  nav: [
    { label: 'Home', href: '/', image: { src: img.hero1, alt: '' } },
    { label: 'Process', href: '/process', image: { src: img.d10, alt: '' } },
  ],
};

/** Names shown in the transit overlay while a slow page loads. */
export function pageName(pathname: string): string {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/process')) return 'Process';
  if (pathname.startsWith('/contact')) return 'Contact';
  if (pathname.startsWith('/projects/')) return 'Project';
  return site.name;
}
