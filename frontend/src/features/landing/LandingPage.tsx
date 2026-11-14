import React, { useState } from "react";
import { LandingNavbar } from "./components/LandingNavbar";
import { HeroSection } from "./components/HeroSection";
import { IntroductionSection } from "./components/IntroductionSection";
import { CapabilitiesSection } from "./components/CapabilitiesSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { FinalCtaSection } from "./components/FinalCtaSection";
import { LandingFooter } from "./components/LandingFooter";
import "../../styles/landing.css";

export interface LandingPageProps {
  onEnterWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  return (
    <div className="haven-landing">
      {/* Persistent Top Navbar with Transitioning Wordmark */}
      <LandingNavbar
        onExplore={onEnterWorkspace}
        showNavWordmark={scrollProgress >= 0.75}
      />

      <main id="landing-content">
        {/* SECTION 1: HERO */}
        <HeroSection
          onExplore={onEnterWorkspace}
          onScrollProgressChange={setScrollProgress}
        />

        {/* SECTION 2: INTRODUCTION */}
        <IntroductionSection />

        {/* SECTION 3: CAPABILITIES (Pinned Horizontal Experience) */}
        <CapabilitiesSection />

        {/* SECTION 4: HOW HAVEN WORKS */}
        <HowItWorksSection />

        {/* SECTION 5: FINAL CTA */}
        <FinalCtaSection onExplore={onEnterWorkspace} />
      </main>

      {/* SECTION 6: FOOTER */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
