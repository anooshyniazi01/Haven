import React from "react";

export const LandingFooter: React.FC = () => {
  const scrollTo = (id?: string) => {
    if (!id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="haven-footer" role="contentinfo">
      <div className="haven-footer-container">
        {/* Main Footer Grid */}
        <div className="haven-footer-grid">
          {/* Brand Column */}
          <div className="haven-footer-brand-col">
            <span className="haven-wordmark haven-footer-wordmark">Haven</span>
            <p className="haven-footer-tagline">Your digital safety workspace.</p>
            <p className="haven-footer-desc">
              An AI-assisted digital forensics and blackmail protection workspace prioritizing privacy, honest reporting, and verifiable evidence preservation.
            </p>
          </div>

          {/* Navigation Links Columns */}
          <div className="haven-footer-nav-col">
            <h4 className="haven-footer-col-title">Explore</h4>
            <ul className="haven-footer-links">
              <li>
                <button type="button" className="haven-footer-link" onClick={() => scrollTo()}>
                  Home
                </button>
              </li>
              <li>
                <button type="button" className="haven-footer-link" onClick={() => scrollTo("capabilities")}>
                  Capabilities
                </button>
              </li>
              <li>
                <button type="button" className="haven-footer-link" onClick={() => scrollTo("how-it-works")}>
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          <div className="haven-footer-nav-col">
            <h4 className="haven-footer-col-title">About</h4>
            <ul className="haven-footer-links">
              <li>
                <span className="haven-footer-text">Local-First Architecture</span>
              </li>
              <li>
                <span className="haven-footer-text">De-escalation &amp; Safety</span>
              </li>
              <li>
                <span className="haven-footer-text">Defensible Cryptography</span>
              </li>
            </ul>
          </div>

          <div className="haven-footer-nav-col">
            <h4 className="haven-footer-col-title">Support</h4>
            <ul className="haven-footer-links">
              <li>
                <a
                  href="https://github.com/anooshyniazi01/Haven/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="haven-footer-link"
                >
                  Report an Issue
                </a>
              </li>
              <li>
                <a
                  href="https://takeitdown.ncmec.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="haven-footer-link"
                >
                  Take It Down (NCMEC)
                </a>
              </li>
              <li>
                <a
                  href="https://www.stopncii.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="haven-footer-link"
                >
                  StopNCII.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="haven-footer-bottom">
          <div className="haven-footer-copy">
            <span>&copy; 2026 Haven. All rights reserved.</span>
            <span>Local Development MVP Foundation.</span>
          </div>
          <div className="haven-footer-legal">
            <span className="haven-legal-item">Cryptographic SHA-256 Verified</span>
            <span className="haven-legal-separator">&bull;</span>
            <a
              href="https://github.com/anooshyniazi01/Haven.git"
              target="_blank"
              rel="noopener noreferrer"
              className="haven-footer-link"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
