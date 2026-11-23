import type { Metadata, Viewport } from 'next';
import { EB_Garamond, Nunito_Sans } from 'next/font/google';
import Providers from '@/components/Providers';
import { LOADER_KEY } from '@/components/Loader/keys';
import { site } from '@/content/site';
import './globals.css';

const serif = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

// Variable font: one file covers the 300/400/500 weights the prototype uses, plus the opsz axis.
const sans = Nunito_Sans({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000',
  ),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: `${site.name} is a residential architecture practice in ${site.city}.`,
  openGraph: { siteName: site.name, type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#fcfbfa',
};

/**
 * Runs before first paint: marks JS as available and decides whether the loader plays
 * (Home, first visit of the session, motion allowed). Doing this before hydration means
 * the page never flashes before the loader covers it.
 */
const boot = `(function(){var d=document.documentElement;d.classList.add('js');try{if(location.pathname==='/'&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!sessionStorage.getItem('${LOADER_KEY}'))d.classList.add('loading')}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
