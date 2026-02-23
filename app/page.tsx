import { getLandingConfigPublic } from '@/lib/landing-config';
import { getFaqPublic } from '@/lib/faq';
import HeroSection from '@/components/home/HeroSection';
import PlatformIntro from '@/components/home/PlatformIntro';
import MissionStrip from '@/components/home/MissionStrip';
import ProgressStepsBar from '@/components/home/ProgressStepsBar';
import PathologySelector from '@/components/home/PathologySelector';
import Statistics from '@/components/home/Statistics';
import ProcessSteps from '@/components/home/ProcessSteps';
import ConsumptionForms from '@/components/home/ConsumptionForms';
import WhyCannabiLize from '@/components/home/WhyCannabiLize';
import Testimonials from '@/components/home/Testimonials';
import EventsSection from '@/components/home/EventsSection';
import BlogPreview from '@/components/home/BlogPreview';
import FAQ from '@/components/home/FAQ';
import CTASection from '@/components/home/CTASection';
import StickyCTAMobile from '@/components/home/StickyCTAMobile';

export default async function Home() {
  const [config, faqItems] = await Promise.all([
    getLandingConfigPublic(),
    getFaqPublic(),
  ]);
  return (
    <div className="flex flex-col pb-20 md:pb-0">
      <HeroSection config={config} />
      <PlatformIntro />
      <ProgressStepsBar config={config} />
      <MissionStrip />
      <PathologySelector />
      <Statistics config={config} />
      <ProcessSteps config={config} />
      {config.showConsumptionFormsSection && <ConsumptionForms config={config} />}
      <WhyCannabiLize />
      <Testimonials config={config} />
      {config.showEventsSection && <EventsSection />}
      {config.showBlogPreviewSection && <BlogPreview />}
      <FAQ items={faqItems} />
      <CTASection />
      <StickyCTAMobile />
    </div>
  );
}
