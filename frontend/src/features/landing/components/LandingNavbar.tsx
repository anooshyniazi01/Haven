import React from "react";

export interface LandingNavbarProps {
  onExplore: () => void;
  showNavWordmark: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onExplore,
  showNavWordmark,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="haven-navbar" role="banner">
      <div className="haven-navbar-inner">
        {/* Brand Wordmark (Active when hero has scrolled) */}
        <div style={{ display: "flex", alignItems: "center", minWidth: "140px" }}>
          <button
            type="button"
            className="haven-navbar-brand"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Haven homepage"
            style={{
              opacity: showNavWordmark ? 1 : 0,
              transform: showNavWordmark ? "none" : "translateY(4px)",
              transition: "opacity 200ms ease, transform 200ms ease",
              pointerEvents: showNavWordmark ? "auto" : "none",
            }}
          >
            <span
              className="haven-wordmark"
              style={{
                fontSize: "24px",
                letterSpacing: "-0.02em",
              }}
            >
              Haven
            </span>
          </button>
        </div>

        {/* Navigation Anchors */}
        <nav aria-label="Landing Navigation">
          <ul className="haven-nav-links">
            <li>
              <button
                type="button"
                className="haven-nav-link"
                onClick={() => scrollToSection("capabilities")}
              >
                Capabilities
              </button>
            </li>
            <li>
              <button
                type="button"
                className="haven-nav-link"
                onClick={() => scrollToSection("how-it-works")}
              >
                How It Works
              </button>
            </li>
          </ul>
        </nav>

        {/* Direct Functional CTA */}
        <div>
          <button
            type="button"
            className="haven-btn-primary"
            onClick={onExplore}
            aria-label="Explore Haven Workspace"
          >
            Explore Haven
          </button>
        </div>
      </div>
    </header>
  );
};
