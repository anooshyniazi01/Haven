import React from "react";

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Upload suspicious media",
      desc: "Select or drop suspect imagery (JPEG, PNG, WEBP up to 25 MB). Files are validated on server ingestion with strict path traversal protection.",
      detail: "Directly calculates SHA-256 byte digest before parsing headers.",
    },
    {
      num: "02",
      title: "Analyze the media",
      desc: "Execute multi-signal forensic inspection: binary geometry, channel bit-depth, quantization tables, and local CPU synthetic likelihood estimation.",
      detail: "Runs locally on your server. Images never leave your device to unverified third-party cloud APIs.",
    },
    {
      num: "03",
      title: "Examine available indicators",
      desc: "Review plain-English findings alongside verifiable metadata tags, stripped EXIF attributes, and privacy-protected GPS status.",
      detail: "Explicit boundaries: absence of metadata is not proof of fraud; likelihood scores communicate confidence intervals.",
    },
    {
      num: "04",
      title: "Document findings",
      desc: "Vault critical media assets into an organized incident record. Connect perpetrator demands, timestamps, and communications into a single timeline.",
      detail: "Every record is preserved in local SQLite storage with cryptographic integrity verification.",
    },
    {
      num: "05",
      title: "Generate an evidence report",
      desc: "Export an official, court-ready PDF dossier containing all computed hashes, technical measurements, and contextual safety resources.",
      detail: "Defensible documentation ready to hand to law enforcement, legal advocates, or crisis support hotlines.",
    },
  ];

  return (
    <section className="haven-workflow-section" id="how-it-works" aria-label="How Haven works">
      <div className="haven-workflow-container">
        {/* Section Header */}
        <div className="haven-workflow-header">
          <span className="haven-section-tag">INVESTIGATIVE WORKFLOW // 5 STAGES</span>
          <h2 className="haven-workflow-heading">How Haven Works</h2>
          <p className="haven-workflow-subheading">
            A methodical, five-stage protocol designed to replace panic with verifiable forensic documentation.
          </p>
        </div>

        {/* Vertical Timeline Stages */}
        <div className="haven-timeline-list">
          {steps.map((s, idx) => (
            <div key={idx} className="haven-stage-item">
              <div className="haven-stage-gutter">
                <div className="haven-stage-bullet">
                  <span>{s.num}</span>
                </div>
                {idx < steps.length - 1 && <div className="haven-stage-connector" aria-hidden="true" />}
              </div>
              <div className="haven-stage-content">
                <div className="haven-stage-header">
                  <h3 className="haven-stage-title">{s.title}</h3>
                  <span className="haven-stage-index">STAGE {s.num}</span>
                </div>
                <p className="haven-stage-desc">{s.desc}</p>
                <div className="haven-stage-meta">
                  <span className="haven-stage-meta-dot" aria-hidden="true" />
                  <span>{s.detail}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
