import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { BrandIntroductionSection, CampaignSection, FaqSection, FeaturedProductsSection, FinalCtaSection, JournalSection, QualityRitualSection } from "@/components/home/HomeSections";
import { Suspense } from "react";

export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="home">
        <Hero
          eyebrow="Himalayan shilajit"
          headline="From the high country, with intention."
          description="An editorial introduction to Kohisaar, shaped around the quiet presence of Himalayan origin."
          primaryCta={{ label: "Shop shilajit", href: "/shop" }}
          secondaryCta={{ label: "Discover our story", href: "/story" }}
          videoSrc="/videos/koh-video-optimized.mp4"
        />
        <BrandIntroductionSection />
        <Suspense fallback={null}><FeaturedProductsSection /></Suspense>
        <CampaignSection />
        <QualityRitualSection />
        <Suspense fallback={null}><JournalSection /></Suspense>
        <Suspense fallback={null}><FaqSection /></Suspense>
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
