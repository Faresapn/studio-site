import Hero from '@/components/Hero/Hero';
import Intro from '@/components/Intro/Intro';
import SectionTitle from '@/components/SectionTitle/SectionTitle';
import WorksGrid from '@/components/WorksGrid/WorksGrid';
import Band from '@/components/Band/Band';
import Cta from '@/components/Cta/Cta';
import Footer from '@/components/Footer/Footer';
import RevealScope from '@/components/RevealScope';
import { home } from '@/content/home';

export default function HomePage() {
  return (
    <RevealScope>
      <Hero hero={home.hero} />
      <Intro text={home.intro} />
      <section aria-labelledby="works-title">
        <SectionTitle id="works-title">{home.worksTitle}</SectionTitle>
        <WorksGrid cards={home.gridA} id="a" />
      </section>
      <Band band={home.band} />
      <WorksGrid cards={home.gridB} id="b" spaced />
      <Cta {...home.cta} />
      <Footer />
    </RevealScope>
  );
}
