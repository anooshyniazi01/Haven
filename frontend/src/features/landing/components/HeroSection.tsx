import React, { useState, useEffect, useRef } from "react";
import { ForensicExhibit } from "./ForensicExhibit";

export interface HeroSectionProps {
  onExplore: () => void;
  onScrollProgressChange?: (progress: number) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExplore,
  onScrollProgressChange,
}) => {
  // Opening animation stages: 0 = initial mount, 1 = wordmark, 2 = text, 3 = exhibit settled
  const [animationStage, setAnimationStage] = useState<number>(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setAnimationStage(3);
      return;
    }

    // Choreographed opening sequence
    const t1 = setTimeout(() => setAnimationStage(1), 120);  // Wordmark appears
    const t2 = setTimeout(() => setAnimationStage(2), 400);  // Tagline and copy reveal
    const t3 = setTimeout(() => setAnimationStage(3), 750);  // Exhibit reveals and settles

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 180;
      const progress = Math.min(1, Math.max(0, scrollY / threshold));
      setScrollProgress(progress);
      if (onScrollProgressChange) {
        onScrollProgressChange(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onScrollProgressChange]);

  const scrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Continuous transform styles for the scrolling wordmark
  // Moves up and scales down smoothly toward the navbar
  const wordmarkTransformStyle: React.CSSProperties = {
    opacity: animationStage >= 1 ? Math.max(0, 1 - scrollProgress * 1.2) : 0,
    transform: `translate3d(0, ${animationStage >= 1 ? -scrollProgress * 48 : 16}px, 0) scale(${1 - scrollProgress * 0.45})`,
    transformOrigin: "left top",
    transition: scrollProgress > 0 ? "none" : "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: "transform, opacity",
  };

  return (
    <section ref={heroRef} className="haven-hero" aria-label="Haven overview">
      <div className="haven-hero-container">
        {/* Left Side: Brand Wordmark, Mission, and Direct Action */}
        <div className="haven-hero-left">
          <div className="haven-hero-wordmark-wrapper">
            <h1
              className="haven-wordmark haven-hero-wordmark"
              style={wordmarkTransformStyle}
            >
              Haven
            </h1>
          </div>

          <div
            style={{
              opacity: animationStage >= 2 ? 1 : 0,
              transform: animationStage >= 2 ? "none" : "translateY(12px)",
              transition: "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <p className="haven-hero-tagline">
              Your digital safety workspace.
            </p>
            <p className="haven-hero-desc">
              Haven brings media examination, evidence documentation, and forensic investigation into one private workspace to help you assess threats and verify digital media.
            </p>

            <div className="haven-hero-actions">
              <button
                type="button"
                className="haven-btn-primary"
                onClick={onExplore}
                aria-label="Explore Haven Workspace"
              >
                Explore Haven
              </button>
              <button
                type="button"
                className="haven-btn-secondary"
                onClick={scrollToHowItWorks}
                aria-label="Learn how Haven works"
              >
                How Haven Works
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Media Forensics Exhibit */}
        <div
          style={{
            opacity: animationStage >= 3 ? 1 : 0,
            transform: animationStage >= 3 ? "none" : "translateY(16px)",
            transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <ForensicExhibit />
        </div>
      </div>
    </section>
  );
};
