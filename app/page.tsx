import HeroSection from "@/components/home/HeroSection";
import PathologySelector from "@/components/home/PathologySelector";
import ProcessSteps from "@/components/home/ProcessSteps";
import Statistics from "@/components/home/Statistics";
import Testimonials from "@/components/home/Testimonials";
import EventsSection from "@/components/home/EventsSection";
import BlogPreview from "@/components/home/BlogPreview";
import FAQ from "@/components/home/FAQ";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <PathologySelector />
      <Statistics />
      <ProcessSteps />
      <Testimonials />
      <EventsSection />
      <BlogPreview />
      <FAQ />
      <CTASection />
    </div>
  );
}
