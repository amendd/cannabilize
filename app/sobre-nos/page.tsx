import AboutHero from '@/components/about/AboutHero';
import AboutHistory from '@/components/about/AboutHistory';
import AboutDifferentials from '@/components/about/AboutDifferentials';
import AboutPillars from '@/components/about/AboutPillars';
import AboutTeam from '@/components/about/AboutTeam';
import AboutEvents from '@/components/about/AboutEvents';
import AboutTestimonials from '@/components/about/AboutTestimonials';
import AboutCommitment from '@/components/about/AboutCommitment';

export default function SobreNosPage() {
  return (
    <div className="flex flex-col">
      <AboutHero />
      <AboutHistory />
      <AboutDifferentials />
      <AboutPillars />
      <AboutTeam />
      <AboutEvents />
      <AboutTestimonials />
      <AboutCommitment />
    </div>
  );
}
