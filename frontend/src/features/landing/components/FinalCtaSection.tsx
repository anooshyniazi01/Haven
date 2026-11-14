import React from "react";

export interface FinalCtaSectionProps {
  onExplore: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onExplore }) => {
  return (
    <section className="haven-cta-section" aria-label="Final call to action">
      <div className="haven-cta-container">
        <div className="haven-cta-card">
          <span className="haven-section-tag">TAKE ACTION // PRIVATE FORENSIC WORKSPACE</span>
          <h2 className="haven-cta-heading">Make sense of what you see.</h2>
          <p className="haven-cta-desc">
            Haven brings suspicious media examination, digital evidence documentation, and forensic investigation into one private workspace.
          </p>
          <div className="haven-cta-actions">
            <button
              type="button"
              className="haven-btn-primary haven-btn-lg"
              onClick={onExplore}
              aria-label="Explore Haven Workspace"
            >
              Explore Haven
            </button>
          </div>
          <div className="haven-cta-footnote">
            <span>LOCAL MVP DEPLOYMENT • ZERO THIRD-PARTY CLOUD INGESTION</span>
          </div>
        </div>
      </div>
    </section>
  );
};
