import React, { useState, useEffect, useRef } from "react";

export const CapabilitiesSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalDist = containerRef.current.offsetHeight - window.innerHeight;
      if (totalDist <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / totalDist));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDesktop]);

  // Translate track based on progress: 4 panels, move by ~75% of track width
  const transformStyle: React.CSSProperties = isDesktop
    ? {
        transform: `translate3d(-${scrollProgress * 75}%, 0, 0)`,
        willChange: "transform",
      }
    : {};

  return (
    <section
      ref={containerRef}
      id="capabilities"
      className="haven-capabilities-section"
      aria-label="Haven capabilities"
    >
      <div className="haven-capabilities-sticky">
        {/* Section Header Bar */}
        <div className="haven-capabilities-header-bar">
          <div className="haven-capabilities-header-inner">
            <span className="haven-section-tag">CAPABILITIES // CORE MODULES</span>
            <div className="haven-capabilities-indicator">
              <span>{Math.min(4, Math.floor(scrollProgress * 4) + 1)} OF 4</span>
              <div className="haven-capabilities-progress-track">
                <div
                  className="haven-capabilities-progress-fill"
                  style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Sliding Track (Desktop) / Vertical Stack (Mobile) */}
        <div ref={trackRef} className="haven-capabilities-track" style={transformStyle}>
          {/* PANEL 01 — Media Analysis */}
          <div className="haven-cap-panel" id="cap-panel-1">
            <div className="haven-cap-panel-header">
              <span className="haven-cap-index">01</span>
              <h3 className="haven-cap-title">Media Analysis</h3>
            </div>
            <p className="haven-cap-desc">
              Examine suspicious images and videos. Uncover physical encoding attributes, quantisation matrices, and format anomalies directly from binary headers.
            </p>

            <div className="haven-cap-exhibit haven-exhibit-analysis">
              <div className="haven-exhibit-top">
                <span className="haven-panel-chip">DIMENSIONS &amp; CHANNELS</span>
                <span className="haven-panel-mono">1920 × 1080 • RGB (8-BIT)</span>
              </div>
              <div className="haven-cap-visual-area">
                <div className="haven-cap-filmstrip">
                  <div className="haven-filmstrip-frame active">
                    <span className="haven-frame-label">FRAME 001</span>
                    <div className="haven-frame-screen" />
                    <span className="haven-frame-mono">RES: 1080P</span>
                  </div>
                  <div className="haven-filmstrip-frame">
                    <span className="haven-frame-label">FRAME 002</span>
                    <div className="haven-frame-screen" />
                    <span className="haven-frame-mono">RES: 1080P</span>
                  </div>
                  <div className="haven-filmstrip-frame">
                    <span className="haven-frame-label">FRAME 003</span>
                    <div className="haven-frame-screen" />
                    <span className="haven-frame-mono">RES: 1080P</span>
                  </div>
                </div>
              </div>
              <div className="haven-exhibit-footer">
                <span className="haven-panel-mono">COMPRESSION RATIO: 11.86:1</span>
                <span className="haven-panel-mono" style={{ color: "var(--haven-brand)" }}>
                  HEADER ANOMALIES: 0 DETECTED
                </span>
              </div>
            </div>
          </div>

          {/* PANEL 02 — Authenticity Investigation */}
          <div className="haven-cap-panel" id="cap-panel-2">
            <div className="haven-cap-panel-header">
              <span className="haven-cap-index">02</span>
              <h3 className="haven-cap-title">Authenticity Investigation</h3>
            </div>
            <p className="haven-cap-desc">
              Examine available indicators, error-level distribution, and potential inconsistencies. We communicate honest certainty limits: no single signal proves manipulation.
            </p>

            <div className="haven-cap-exhibit haven-exhibit-investigation">
              <div className="haven-exhibit-top">
                <span className="haven-panel-chip">DUAL-PANE ELA COMPARISON</span>
                <span className="haven-panel-mono">CONFIDENCE: BOUNDED EVALUATION</span>
              </div>
              <div className="haven-comparison-grid">
                <div className="haven-comp-pane">
                  <span className="haven-comp-label">BASELINE LUMINANCE</span>
                  <div className="haven-comp-canvas canvas-baseline" />
                  <span className="haven-comp-caption">STANDARD RGB SPECTRUM</span>
                </div>
                <div className="haven-comp-pane">
                  <span className="haven-comp-label">ERROR LEVEL ANALYSIS (ELA)</span>
                  <div className="haven-comp-canvas canvas-ela" />
                  <span className="haven-comp-caption">VARIANCE DELTA: 0.042 (NOMINAL)</span>
                </div>
              </div>
              <div className="haven-exhibit-footer">
                <span className="haven-panel-mono">LOCAL INFERENCE: ONNX MODEL v1.0.0</span>
                <span className="haven-panel-mono" style={{ color: "var(--haven-warning)" }}>
                  LIMITATION: PLATFORM COMPRESSION OBSCORES EDGES
                </span>
              </div>
            </div>
          </div>

          {/* PANEL 03 — Evidence Documentation */}
          <div className="haven-cap-panel" id="cap-panel-3">
            <div className="haven-cap-panel-header">
              <span className="haven-cap-index">03</span>
              <h3 className="haven-cap-title">Evidence Documentation</h3>
            </div>
            <p className="haven-cap-desc">
              Organize findings and preserve observations. Every piece of ingested media is anchored with a cryptographic SHA-256 digest in a structured, tamper-evident ledger.
            </p>

            <div className="haven-cap-exhibit haven-exhibit-ledger">
              <div className="haven-exhibit-top">
                <span className="haven-panel-chip">EVIDENCE VAULT LEDGER</span>
                <span className="haven-panel-mono">STORAGE: LOCAL SQLITE ENCRYPTED</span>
              </div>
              <div className="haven-ledger-list">
                <div className="haven-ledger-item">
                  <span className="haven-ledger-hash">4bd44765c018...b38d2b16</span>
                  <span className="haven-ledger-name">threat_screenshot_01.png</span>
                  <span className="haven-ledger-status status-verified">VERIFIED UNALTERED</span>
                </div>
                <div className="haven-ledger-item">
                  <span className="haven-ledger-hash">e3b0c44298fc...b92427ae</span>
                  <span className="haven-ledger-name">demand_voicemail_clip.wav</span>
                  <span className="haven-ledger-status status-verified">VERIFIED UNALTERED</span>
                </div>
                <div className="haven-ledger-item">
                  <span className="haven-ledger-hash">9f83c076a91d...5e89d211</span>
                  <span className="haven-ledger-name">demands_chat_log.pdf</span>
                  <span className="haven-ledger-status status-verified">VERIFIED UNALTERED</span>
                </div>
              </div>
              <div className="haven-exhibit-footer">
                <span className="haven-panel-mono">TOTAL VAULTED EXHIBITS: 3</span>
                <span className="haven-panel-mono" style={{ color: "var(--haven-brand)" }}>
                  INTEGRITY: 100% BYTE MATCH
                </span>
              </div>
            </div>
          </div>

          {/* PANEL 04 — Evidence Reports */}
          <div className="haven-cap-panel" id="cap-panel-4">
            <div className="haven-cap-panel-header">
              <span className="haven-cap-index">04</span>
              <h3 className="haven-cap-title">Evidence Reports</h3>
            </div>
            <p className="haven-cap-desc">
              Export defensible, structured forensic dossiers to PDF. Prepared with timestamps, cryptographic proofs, and plain-language summaries for law enforcement or crisis advocates.
            </p>

            <div className="haven-cap-exhibit haven-exhibit-report">
              <div className="haven-exhibit-top">
                <span className="haven-panel-chip">EXPORTABLE DOSSIER PREVIEW</span>
                <span className="haven-panel-mono">FORMAT: REPORTLAB PDF v1.4</span>
              </div>
              <div className="haven-report-preview">
                <div className="haven-report-doc">
                  <div className="haven-report-title-strip">
                    <span className="haven-report-brand">HAVEN FORENSIC DOSSIER</span>
                    <span className="haven-report-id">CASE // HAVEN-2026-081</span>
                  </div>
                  <div className="haven-report-rows">
                    <div className="haven-report-row">
                      <span>PRIMARY EXHIBIT:</span>
                      <strong>suspect_image.png</strong>
                    </div>
                    <div className="haven-report-row">
                      <span>SHA-256 DIGEST:</span>
                      <code>4bd44765c01871940ab0ac891768427893665756779b932bc106d9ecb38d2b16</code>
                    </div>
                    <div className="haven-report-row">
                      <span>TECHNICAL VERDICT:</span>
                      <span>INSPECTION COMPLETE • SYNTHETIC SIGNAL NOMINAL</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="haven-exhibit-footer">
                <span className="haven-panel-mono">EXPORT ACTION: ONE-CLICK PDF</span>
                <span className="haven-panel-mono" style={{ color: "var(--haven-brand)" }}>
                  CHAIN OF CUSTODY SECURED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
