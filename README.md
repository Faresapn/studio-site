# Studio Name: studio website

A Next.js build of the House of Kletos HTML prototype: the home page (pixel-matched to the 1512px frame, fluid below 1100px), the first-visit loader, page transitions, and an extra layer of continuous, shared-element motion so every photo and meaningful element leads somewhere.

## Run it

Requirements: Node 20.9+ (built on Node 25), npm 10+.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all routes are static)
npm start          # serve the production build
npm run lint       # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck  # tsc --noEmit
npm run format     # Prettier
```

Images and logo marks come out of the prototype with a script. Its output is committed, so you only run it if the prototype changes:

```bash
# put the prototype at reference/prototype.html (gitignored), then
npm run extract:images
```

It decodes the 25 base64 JPEGs from `const IMG={...}`, re-encodes them with sharp (progressive JPEG at q80: 2400px on the long edge for full-bleed images, 1600px for the rest) into `src/assets/images/`, and writes the LOGO placeholder and the House of Kletos mark as React components into `src/components/icons/`. `next/image` then serves AVIF/WebP at the right size, with blur placeholders.

Screenshot pass (site and prototype captured the same way at 1512×945, 1280×800, 1024×768, 768×1024 and 390×844 into `screens/`, gitignored):

```bash
npm run build && npm start   # in one terminal
npm run screens              # BASE=http://localhost:3000 by default; SIZES / ONLY=site|proto to narrow it
```

## Project structure

```
src/
  app/                    routes (App Router)
    layout.tsx            fonts, metadata, the pre-paint boot script, client shell
    page.tsx              Home
    projects/[slug]/      project detail (generateStaticParams: all five are prerendered)
    process/              Process (card version, see Deviations)
    contact/              placeholder contact page
    globals.css           design tokens from the prototype's :root, base rules, shared .lk link, reveal states
  content/                all copy and image choices, typed; components never hard-code text
    types.ts              shapes that map 1:1 onto the planned CMS documents
    site.ts home.ts projects.ts process.ts images.ts
  components/             one folder per component, each with its CSS Module
    PageTransition/       provider (<main> wrapper), transit overlay, <TransitionLink>
    Loader/ Hero/ Menu/ MenuTab/ WorksGrid/ WorkCard/ Band/ Cta/ Footer/ Logo/
    RevealText/ ParallaxImage/ Intro/ SectionTitle/
    ProjectHero/ Gallery/ Lightbox/ NextProject/
    icons/                extracted SVG marks (generated)
  hooks/                  useLenis, useReveal, useReducedMotion, useHeroSlider, useFocusTrap
  lib/
    transition.ts         the page-transition controller (route + shared-element + back/forward)
    motion.ts             Motion helpers: the prototype's --out / --io curves, the shared frame loop
    scroll.ts             the Lenis instance and named scroll locks
    menu.ts               menu open state (tiny external store)
  assets/images/          extracted photos (static imports)
scripts/
  extract-images.mjs      prototype → images + icons
  screens.mjs             Playwright screenshot pass
```

## How the motion works

- **Units.** The prototype's system is kept as is: `--u: calc(100vw / 1512)` for layout, `--t: min(var(--u), 1px)` for type, and `--u: 1px` below 1100px. Every size in the CSS Modules is written as `calc(N * var(--u))` from the Figma frame.
- **Loader.** A tiny inline script in `<head>` runs before first paint. On Home, on the first visit of the session (sessionStorage), with motion allowed, it adds `html.loading`. That's the only thing that makes the loader visible, so the page never flashes before it. The first paint is static: logo, an empty frame, "Loading 000%". Then a Motion sequence runs on the prototype's timeline. Three houses and then the hero photo arrive every 550 ms; each wipes up and settles from a slight zoom while the house underneath is pushed gently upwards, like a stack of prints being turned over. The count rolls as an odometer (0→100 over 2.8 s on the ease-out curve) and a hairline under the frame fills. At 2.8 s the logo drifts up and the count leaves to the right. At +250 ms the frame opens to full screen while the hero photo settles from its zoom, landing exactly as the Home hero. Then the loader is removed and the hero headline rises.
- **Route transitions** (`lib/transition.ts`). Each internal link is a real `<a href>` (`<TransitionLink>`, built on `next/link`'s `onNavigate`), so links work without JS and modifier-click still opens a new tab. On click: the page fades out (320 ms) → `router.push` → wait for the route to render and its first images to decode. If that takes more than 250 ms, the transit overlay (logo, travelling line, page name) appears and stays at least 300 ms. Then scroll resets, the page fades and rises in (800 ms) and its own intros start. Focus moves to `<main>`, and a live region announces the new page.
- **Shared element.** Cards, hero slides, "See project", the menu photo and "Next project" carry a `data-flip-src` box. On click, a fixed clone is laid exactly over it, keeping its current hover zoom or parallax offset. The clone flies to the project hero's rect while the page fades. The full-width image source is layered into the clone as soon as it loads. After navigation the clone snaps to the measured `[data-flip-target]` and cross-fades out once the real hero has decoded, so there's never a blank frame.
- **Back/Forward.** Next swaps the DOM immediately on popstate, so the outgoing page is frozen into a "ghost" layer, which then fades. If you're leaving the project you flew into, its hero flies back into the card it came from, provided that card is on screen after scroll restoration (scroll positions are stored per path). Otherwise it falls back to the normal route transition.
- **Page-enter signal.** Components that animate in (hero lines, reveals, slider timing) subscribe through `onPageEnter`. It fires after the loader, or when a transition starts its enter phase, so nothing plays while it's hidden.
- **Reveals** follow the prototype exactly: only elements below 72% of the viewport are armed. They reveal at a third of the way up (rootMargin −30%). Cards in a row stagger by 90 ms, and their caption follows 250 ms later.
- **Lenis** replaces the prototype's wheel lerp with the same lerp (0.1), running on Motion's frame loop. It's off on coarse pointers and with reduced motion; touch scrolling stays native.
- **Reduced motion.** No loader, no parallax or drift, instant transitions; all content stays visible.

## Assumptions

- **Loader once per session.** It plays on the first Home visit of a browser session (sessionStorage) and is skipped on later visits and on deep links to other pages, because it opens into the Home hero.
- **Extra pages.** Project pages, the contact page and the 404 are additions. The client asked for every element to lead somewhere, and the prototype has no destination for cards, "See project" or the contact links.
- **Placeholder content is kept as is**: "LOGO", "Studio Name", House A–E, "City", the address, the social labels. Project descriptions are clearly marked placeholder text. Each house's gallery reuses the prototype photos that belong to it.
- **Card meta vs hero meta.** The prototype prints "Residential · 2025" under every card, while the hero says House A is from 2024. Cards keep their own category and year to match the prototype; project pages use the project's year.
- **Menu photo.** On Home, the menu photo (hero1) is House A's cover, so clicking it opens House A with the shared-element motion. On the Process item it opens Process.
- **Social labels and the House of Kletos credit** lead to `/contact` until real URLs exist.

## Deviations from the prototype

| What                                                                                                                                                            | Why                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero headline lines slide out and in with a stagger. The prototype's final CSS overrides the slide (`transform:none!important`) and only cross-fades the group. | The brief explicitly asks for staggered line slides, and the same line-reveal is reused for project titles.                                                                                                                                                                                                                              |
| The "Refresh" button **is** built (top right), although the brief said to leave it out.                                                                         | Added at the client's request after the first review. Like the prototype's, it replays the loader in place (no page reload, photos already cached) and returns to Home; the page remounts underneath so the hero intro and slider start over too. Hidden while the menu is open. With reduced motion it just returns to the top of Home. |
| Process is a static page (hero, intro, the six stages as cards), not the Three.js build-up.                                                                     | Optional per brief and not done yet. Home, the loader and the transitions came first. The content model already holds all six stages, so the 3D version can drop in.                                                                                                                                                                     |
| Lenis instead of the custom wheel lerp.                                                                                                                         | Per brief; tuned to the same lerp (0.1). Touch and keyboard stay native, as before.                                                                                                                                                                                                                                                      |
| Motion (motion.dev) instead of GSAP for every animation.                                                                                                        | Requested by the client after the first review, together with Motion's AI Kit guidance: one animation library, transform/opacity/clip-path only, no overshoot for a quiet architecture site, reduced motion respected. Timings and curves are unchanged; the prototype's --out/--io curves are passed to Motion as cubic-bezier arrays.  |
| Nunito Sans is loaded as the variable font (weights 300–500 plus the `opsz` axis), not three static weights.                                                    | `next/font` only allows the `opsz` axis on the variable font. One file instead of three.                                                                                                                                                                                                                                                 |
| `d10` (Process hero) and `wabuild` (the as-built photo) also get the 2400px limit, not just hero and band.                                                      | They're full-bleed too.                                                                                                                                                                                                                                                                                                                  |
| Hover effects on cards, gallery and "Next project" are wrapped in `@media (hover: hover)`.                                                                      | Avoids sticky zoom after a tap. Touch screens get the prototype's `hover: none` fallback (hero meta and "See project" always visible).                                                                                                                                                                                                   |
| The logo link's accessible name is "LOGO, Studio Name home".                                                                                                    | The visible text is "LOGO"; accessible names must contain the visible label (WCAG 2.5.3). This goes away with a real logo.                                                                                                                                                                                                               |
| The muted meta grey (#8C8A88) is kept.                                                                                                                          | It's the design's colour, but at 12px it is below AA contrast. Flagged for the designer; it's the only accessibility item Lighthouse raises.                                                                                                                                                                                             |

## Quality

Lighthouse on the production build (`next start`, Lighthouse 12, mobile unless noted):

| Page                           | Perf | A11y | Best practices | SEO |
| ------------------------------ | ---- | ---- | -------------- | --- |
| Home, first visit, with loader | 84   | 96   | 100            | 100 |
| Home, desktop                  | 98   | 96   | 100            | 100 |
| Project (House A / House B)    | 100  | 100  | 100            | 100 |
| Process                        | 92   | 100  | 100            | 100 |
| Contact                        | 95   | 96   | 100            | 100 |

The mobile Home figure is driven by the loader. The LCP element is the hero photo, which by design only appears in the loader frame at 1.65 s and opens to full screen at 3–4.3 s. The browser's observed LCP was 2.2 s; Lighthouse's simulated throttling stretches it to 4.6 s. CLS is 0. (Measured before the switch to Motion; see the final checkpoint for current numbers.)

`npm run lint`, `npm run typecheck` and `npm run build` pass with no errors or warnings.

## What I would do next

- **CMS**: move content to Sanity (plan below) so the studio can publish projects themselves.
- **Real project content**: copy, credits, more photos per house, project-specific hero crops.
- **Process 3D**: rebuild the Three.js house that draws itself across six scroll stages, dynamically importing `three` so it never loads on Home.
- **Contact form**: a server action with validation, a honeypot plus Turnstile for spam, and email delivery (Resend) or a CRM hook.
- **Analytics**: Vercel Web Analytics and Speed Insights, plus events for "See project" and contact clicks.
- **Images**: Sanity's image pipeline with hotspots, or tuned `deviceSizes` once real art direction exists. Consider AVIF-only for full-bleed photos.
- **Motion**: a View Transitions API path for browsers that support cross-document transitions, keeping the current Motion path as fallback.

## Tech stack (now)

Next.js 16 (App Router, Cache Components, static generation) · React 19 · TypeScript (strict) · CSS Modules plus one `globals.css` of tokens · Motion (motion.dev) · Lenis · `next/image` and `next/font` · Playwright (screenshot pass) · sharp (image extraction) · Vercel.

## Planned CMS (if the client manages content)

**Sanity** as the headless CMS: an embedded Studio at `/studio`, and the free tier covers a studio site.

Document types, mirroring `src/content/types.ts` one to one:

- `siteSettings` (singleton): name, city, address, appointment line, socials, credit.
- `project`: slug, name, category, year, location, cover (image + alt), gallery (images + alt), description (portable text), order.
- `homePage` (singleton): hero slides (each references a `project`, picks an image, has a two-line headline and meta), intro, works title, the two grids as ordered arrays of `{ project reference, image, wide }`, the band (image, title, text, link), the CTA.
- `processStage` (ordered): number, title, copy, image. Plus a `processPage` singleton for the hero and outro.

Content is fetched with GROQ in Server Components (`next-sanity`), and images go through Sanity's image CDN with hotspot crops. A Sanity webhook calls a route handler that revalidates by tag (`revalidateTag('project')`, etc.), so a publish shows up in seconds without a redeploy. A Vercel deploy hook is the fallback. Because the components only read the typed content objects, switching from local files to Sanity changes only the data layer (`src/content/*` becomes query functions). Keys go in `.env.local` and Vercel environment variables; see `.env.example`.
