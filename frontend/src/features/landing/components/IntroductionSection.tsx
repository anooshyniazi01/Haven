import React from "react";

export const IntroductionSection: React.FC = () => {
  return (
    <section className="haven-intro-section" id="introduction" aria-label="Haven introduction">
      <div className="haven-intro-container">
        {/* Editorial Statement */}
        <div className="haven-intro-header">
          <div className="haven-section-tag">INVESTIGATIVE BRIEFING // 001</div>
          <h2 className="haven-intro-heading">
            Not everything online is what it appears to be.
          </h2>
          <p className="haven-intro-subheading">
            Haven brings media examination, evidence documentation, and investigation into one workspace.
          </p>
        </div>

        {/* Editorial Storytelling Composition */}
        <div className="haven-intro-grid">
          {/* Column 1: The Investigative Problem */}
          <div className="haven-intro-card">
            <div className="haven-intro-card-header">
              <span className="haven-intro-card-num">01 / CONTEXT</span>
              <span className="haven-intro-card-label">UNTRUSTED INGESTION</span>
            </div>
            <div className="haven-intro-card-content">
              <p className="haven-intro-paragraph">
                In online extortion and image-based blackmail, manipulated or synthetic imagery is deliberately deployed to induce panic, confusion, and compliance.
              </p>
              <div className="haven-intro-callout">
                <span className="haven-callout-marker" aria-hidden="true" />
                <p>
                  Incoming media transmitted through messaging apps is almost always re-compressed and stripped of camera EXIF data. Absence of metadata is not proof of tampering, but it obscures origin.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: The Haven Methodology */}
          <div className="haven-intro-card">
            <div className="haven-intro-card-header">
              <span className="haven-intro-card-num">02 / APPROACH</span>
              <span className="haven-intro-card-label">OBJECTIVE VERIFICATION</span>
            </div>
            <div className="haven-intro-card-content">
              <p className="haven-intro-paragraph">
                Haven rejects sensationalist AI claims and guaranteed verdicts. We measure deterministic binary properties, error level variance, and model likelihoods with documented limitations.
              </p>
              <div className="haven-intro-callout">
                <span className="haven-callout-marker" aria-hidden="true" />
                <p>
                  Every file ingested receives a cryptographic SHA-256 hash immediately upon entry, locking its bitstream so that evidence presented to authorities is verifiable and defensible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
