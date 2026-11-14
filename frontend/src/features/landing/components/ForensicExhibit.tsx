import React from "react";

export const ForensicExhibit: React.FC = () => {
  // Waveform bars representing spatial error level / compression distribution
  const waveformHeights = [
    24, 38, 55, 42, 68, 85, 92, 74, 60, 48, 70, 82, 65, 50, 36, 44, 76, 88, 62, 40, 28, 52, 64, 46, 32
  ];

  return (
    <div className="haven-exhibit-container" aria-label="Digital media forensics exhibit">
      <div className="haven-exhibit-card">
        {/* Terminal / Exhibit Header */}
        <div className="haven-exhibit-header">
          <div className="haven-exhibit-header-left">
            <span className="haven-exhibit-status-dot" aria-hidden="true" />
            <span className="haven-exhibit-tag">EXHIBIT // MEDIA_INSPECTION_0491</span>
          </div>
          <span className="haven-exhibit-tag">SHA-256 VERIFIED</span>
        </div>

        {/* Visual Inspection Canvas */}
        <div className="haven-exhibit-body">
          <div className="haven-exhibit-canvas">
            {/* Structural Coordinate Grid */}
            <div className="haven-exhibit-grid" aria-hidden="true" />

            {/* Target Reticle Overlay */}
            <div className="haven-exhibit-reticle" aria-hidden="true">
              <span className="haven-exhibit-corner haven-corner-tl" />
              <span className="haven-exhibit-corner haven-corner-tr" />
              <span className="haven-exhibit-corner haven-corner-bl" />
              <span className="haven-exhibit-corner haven-corner-br" />
            </div>

            {/* Magnification Sampling Loupe */}
            <div className="haven-exhibit-magnifier" aria-hidden="true">
              <div className="haven-magnifier-header">
                <span>CROP_ZOOM 8X</span>
                <span>ELA // 0.042</span>
              </div>
              <div className="haven-magnifier-raster" />
            </div>
          </div>

          {/* Temporal / Spectral Waveform Strip */}
          <div className="haven-exhibit-timeline">
            <div className="haven-timeline-header">
              <span>FREQUENCY &amp; COMPRESSION ARTIFACT PROFILE</span>
              <span>SAMPLING: 250 HZ</span>
            </div>
            <div className="haven-waveform-track" aria-hidden="true">
              {waveformHeights.map((h, i) => (
                <div
                  key={i}
                  className={`haven-waveform-bar ${i >= 5 && i <= 8 ? "active" : ""}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Forensic Metadata Properties */}
          <div className="haven-exhibit-metadata">
            <div className="haven-metadata-cell">
              <span className="haven-metadata-label">TARGET MEDIA</span>
              <span className="haven-metadata-value">suspect_frame_01.png</span>
            </div>
            <div className="haven-metadata-cell">
              <span className="haven-metadata-label">CRYPTOGRAPHIC SHA-256</span>
              <span className="haven-metadata-value">4bd44765...b38d2b16</span>
            </div>
            <div className="haven-metadata-cell">
              <span className="haven-metadata-label">GEOMETRY / ASPECT</span>
              <span className="haven-metadata-value">1920 × 1080 (16:9) • 8-BIT RGB</span>
            </div>
            <div className="haven-metadata-cell">
              <span className="haven-metadata-label">EXIF METADATA AUDIT</span>
              <span className="haven-metadata-value" style={{ color: "var(--haven-brand)" }}>
                GPS STRIPPED • HEADERS LOGGED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
