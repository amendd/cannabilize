import AboutHero from '@/components/about/AboutHero';
import AboutProofSocial from '@/components/about/AboutProofSocial';
import AboutHistory from '@/components/about/AboutHistory';
import AboutFounders from '@/components/about/AboutFounders';
import AboutInside from '@/components/about/AboutInside';
import AboutHowWeHelp from '@/components/about/AboutHowWeHelp';
import AboutDifferentials from '@/components/about/AboutDifferentials';
import AboutImpact from '@/components/about/AboutImpact';
import AboutTestimonials from '@/components/about/AboutTestimonials';
import AboutMissionVision from '@/components/about/AboutMissionVision';
import AboutNotAlone from '@/components/about/AboutNotAlone';
import AboutOperationSignal from '@/components/about/AboutOperationSignal';
import AboutCTAFinal from '@/components/about/AboutCTAFinal';

export default function SobreNosPage() {
  return (
    <main id="main-content" className="flex flex-col">
      <AboutHero />
      <AboutProofSocial />
      <AboutHistory />
      <AboutFounders />
      <AboutInside />
      <AboutHowWeHelp />
      <AboutDifferentials />
      <AboutImpact />
      <AboutTestimonials />
      <AboutMissionVision />
      <AboutNotAlone />
      <AboutOperationSignal />
      <AboutCTAFinal />
    </main>
  );
}
