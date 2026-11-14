import React, { useEffect, useState } from "react";
import "../../styles/landing.css";

export interface LandingPageProps {
  onEnterWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
  // State for interactive features
  const [elaMode, setElaMode] = useState<"optical" | "ela">("optical");
  const [activeCap, setActiveCap] = useState<number>(0);
  const [selectedFrame, setSelectedFrame] = useState<number>(214);
  const [comparisonSplit, setComparisonSplit] = useState<number>(50);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);
  const [activeReportTab, setActiveReportTab] = useState<"summary" | "indicators" | "metadata">("summary");
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");

    const $ = <T extends HTMLElement = HTMLElement>(s: string): T | null => document.querySelector(s);
    const $$ = <T extends HTMLElement = HTMLElement>(s: string): T[] => Array.from(document.querySelectorAll(s));
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const wm = $("#wm");
    const slot = $("#slot");
    const hdr = $("#hdr");

    document.body.style.backgroundColor = "#080B09";
    document.body.style.color = "#ffffff";

    /* Waveform generator in hero */
    $$("[data-wave]").forEach((s) => {
      const n = +(s.dataset.wave || 96);
      let h = "";
      let seed = 7;
      for (let i = 0; i < n; i++) {
        seed = (seed * 9301 + 49297) % 233280;
        const r = seed / 233280;
        const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.19) * Math.cos(i * 0.057));
        const a = Math.max(2, r * env * 38);
        const isHighlight = i > 52 && i < 60;
        h += `<rect x="${i * (400 / n) + 0.6}" y="${23 - a / 2}" width="${
          400 / n - 1.4
        }" height="${a}" fill="${isHighlight ? "#39D98A" : "#A5AAA6"}" opacity="${
          isHighlight ? 1 : 0.55
        }"/>`;
      }
      s.innerHTML = h;
    });

    /* Wordmark: scroll-linked move + scale into the header */
    const m = { x: 0, y: 0, s: 0.2, pad: 24, ty: 15 };
    function measure() {
      if (!wm || !slot) return;
      wm.style.transform = "none";
      const r = slot.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(slot).fontSize) || 120;
      m.x = r.left + window.scrollX;
      m.y = r.top + window.scrollY;
      m.s = 26 / fs;
      m.pad = Math.max(16, window.innerWidth * 0.04 < 56 ? Math.min(56, Math.max(20, window.innerWidth * 0.04)) : 56);
      m.ty = (56 - 26) / 2;
      update();
    }

    function update() {
      if (!wm || !hdr) return;
      const y = window.scrollY;
      const p = clamp(y / (window.innerHeight * 0.5));
      const e = p * p * (3 - 2 * p);
      wm.style.transform = `translate(${lerp(m.x, m.pad, e)}px,${lerp(m.y, m.ty, e)}px) scale(${lerp(1, m.s, e)})`;
      root.style.setProperty("--p", p.toFixed(3));
      hdr.style.setProperty("--hb", e.toFixed(3));
    }

    /* Staggered scroll reveals */
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    $$(".rv, .s2-step").forEach((el) => io.observe(el));

    let tick = false;
    const handleScroll = () => {
      if (!tick) {
        tick = true;
        requestAnimationFrame(() => {
          update();
          tick = false;
        });
      }
    };

    function all() {
      measure();
      update();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", all);

    all();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        all();
        requestAnimationFrame(() => root.classList.add("go"));
      });
    } else {
      root.classList.add("go");
    }

    const tFallback = setTimeout(() => root.classList.add("go"), 2500);

    return () => {
      clearTimeout(tFallback);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", all);
      io.disconnect();
      root.classList.remove("go");
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
    };
  }, []);

  const handleCopyHash = () => {
    navigator.clipboard?.writeText("9f3a8b2c4d1e7f093125a6e8b4c2d1e0f7a9c3e5b1d4f6a8c2e0b7d9f1a3c5e7");
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <>
      {/* Sticky Header */}
      <header id="hdr">
        <a className="h" href="#capabilities">
          Capabilities
        </a>
        <a className="h" href="#how">
          How it works
        </a>
        <button type="button" className="nav-cta" onClick={onEnterWorkspace}>
          Open Haven
        </button>
      </header>

      {/* Continuous Scroll-Linked Animated Wordmark (Lora) */}
      <a id="wm" href="#top" aria-label="Haven, back to top">
        Haven
      </a>

      <main>
        {/* SECTION 1: HERO */}
        <section className="hero" aria-label="Haven">
          <div className="hl">
            <div id="slot" aria-hidden="true">
              Haven
            </div>
            <div className="tag hfade e e1">When something looks off, look closer.</div>
            <p className="d hfade e e2">
              Upload an image or video. Haven checks what it can, records what it finds, and exports a clear report.
            </p>
            <div className="ctas hfade e e3">
              <button type="button" className="btn-start" onClick={onEnterWorkspace}>
                Open Haven
              </button>
              <a className="btn-learn" href="#how">
                See how it works →
              </a>
            </div>
          </div>

          <figure className="exam e ev" aria-label="Illustrative media examination exhibit">
            <div className="frame">
              <div className="hero-terminal-view">
                <div className="ht-header">
                  <div className="ht-dots">
                    <span />
                    <span />
                    <span className="live" />
                  </div>
                  <span className="mono ht-title">haven_engine · forensic_inspection_session_0417</span>
                  <span className="mono ht-status">LIVE CAPTURE</span>
                </div>

                <div className="ht-body">
                  <div className="ht-stream">
                    <div className="ht-spec-header">
                      <span className="mono tag-id">FEED: interview_clip_0417.mp4</span>
                      <span className="mono tag-time">TC: 00:07.13 · FRAME 214</span>
                    </div>

                    <div className="ht-canvas-area">
                      {/* Detailed forensic examination canvas */}
                      <svg viewBox="0 0 420 220" className="ht-inspection-svg" role="img" aria-label="Forensic media inspection display">
                        <defs>
                          <pattern id="htgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#15281E" strokeWidth="0.5" />
                          </pattern>
                          <radialGradient id="heatglow" cx="62%" cy="56%" r="28%">
                            <stop offset="0%" stopColor="#39D98A" stopOpacity="0.45" />
                            <stop offset="60%" stopColor="#D9A441" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#08140E" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="#07130D" />
                        <rect width="100%" height="100%" fill="url(#htgrid)" />
                        
                        {/* Thermal anomaly glow over jaw/neck transition */}
                        <circle cx="260" cy="122" r="50" fill="url(#heatglow)" />

                        {/* Subject head & jaw profile contour */}
                        <path d="M 190 50 C 235 48, 275 75, 278 115 C 280 135, 268 152, 248 162 C 230 171, 210 170, 195 160 C 180 152, 172 135, 174 112 C 176 80, 182 52, 190 50 Z" fill="#10241A" stroke="#254834" strokeWidth="1.2" />
                        
                        {/* Facial landmark tracking mesh */}
                        <circle cx="218" cy="98" r="2.5" fill="#39D98A" />
                        <circle cx="248" cy="96" r="2.5" fill="#39D98A" />
                        <circle cx="234" cy="118" r="2.5" fill="#39D98A" />
                        <path d="M 218 98 L 234 118 L 248 96" fill="none" stroke="#39D98A" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 2" />

                        {/* Anomaly flagged zone 2: Jaw Edge Boundary */}
                        <rect x="232" y="128" width="48" height="34" rx="2" fill="none" stroke="#E5A93C" strokeWidth="1.5" strokeDasharray="3 3" />
                        <text x="284" y="148" fill="#E5A93C" className="mono" fontSize="9">REGION 2 · DISCONTINUITY</text>
                        <path d="M 242 134 C 254 138, 265 146, 272 156" fill="none" stroke="#E5A93C" strokeWidth="2" />

                        {/* Analysis targeting bracket */}
                        <path d="M 170 42 L 180 42 M 170 42 L 170 52 M 300 42 L 290 42 M 300 42 L 300 52 M 170 180 L 180 180 M 170 180 L 170 170 M 300 180 L 290 180 M 300 180 L 300 170" fill="none" stroke="#39D98A" strokeWidth="1.2" />
                        <text x="175" y="36" fill="#39D98A" className="mono" fontSize="8.5">TRACK_01 // LANDMARK_ALIGN</text>
                      </svg>

                      {/* Enlarged interactive crop loupe */}
                      <div className="hero-loupe">
                        <div className="loupe-header mono">
                          <span>2 · JAW CONTOUR · 6× ZOOM</span>
                          <span className="badge-warn">FLAGGED</span>
                        </div>
                        <div className="loupe-viewport">
                          <svg viewBox="230 125 52 38" className="loupe-svg" role="img" aria-label="Magnified crop of region 2">
                            <rect width="100%" height="100%" fill="#0A1811" />
                            <circle cx="260" cy="122" r="50" fill="url(#heatglow)" />
                            <path d="M 190 50 C 235 48, 275 75, 278 115 C 280 135, 268 152, 248 162" fill="none" stroke="#254834" strokeWidth="2.5" />
                            <path d="M 242 134 C 254 138, 265 146, 272 156" fill="none" stroke="#E5A93C" strokeWidth="3" />
                            <line x1="230" y1="140" x2="280" y2="140" stroke="#39D98A" strokeWidth="0.5" strokeDasharray="2 2" />
                            <line x1="255" y1="125" x2="255" y2="165" stroke="#39D98A" strokeWidth="0.5" strokeDasharray="2 2" />
                          </svg>
                          <div className="loupe-data mono">
                            <div><span>Resampling delta:</span> <strong>+18.4%</strong></div>
                            <div><span>Edge variance:</span> <strong style={{ color: "#E5A93C" }}>Inconsistent</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ht-footer">
                  <svg className="wave" data-wave="96" viewBox="0 0 400 46" preserveAspectRatio="none" role="img" aria-label="Audio waveform of the sample file" />
                  <div className="ht-meta mono">
                    <span>interview_clip_0417.mp4 · H.264 · 1920×1080 · 29.97 fps</span>
                    <span>SHA-256 9f3a…c71e · prototype content, no analysis performed</span>
                  </div>
                </div>
              </div>
            </div>
          </figure>
        </section>

        {/* SECTION 2: STAGGERED REVEAL & INTERACTIVE FORENSIC ARTIFACTS */}
        <section className="s2-forensics" aria-label="Forensic Inspection Overview">
          <div className="s2-grid">
            {/* Step 1: Left headline appears first */}
            <div className="s2-step s2-step-1">
              <h2>Some things are hard to verify by eye.</h2>
            </div>

            {/* Step 3: Right copy block appears third */}
            <div className="s2-step s2-step-3">
              <p className="s2-lead">
                Edited media can look convincing. Haven examines indicators and builds a record of what it observed — not a verdict.
              </p>
              <p className="s2-sub cap">
                Explore real media indicators below. Toggle forensic view modes to inspect underlying compression anomalies.
              </p>
            </div>

            {/* Step 2: Left interactive forensic ELA artifact appears second */}
            <div className="s2-step s2-step-2">
              <div className="forensic-card">
                <div className="fc-topbar">
                  <div className="fc-meta mono">
                    <span className="fc-tag">EXHIBIT A // ERROR LEVEL ANALYSIS</span>
                    <span>FRAME 214</span>
                  </div>
                  <div className="fc-controls">
                    <button
                      type="button"
                      className={`fc-btn ${elaMode === "optical" ? "active" : ""}`}
                      onClick={() => setElaMode("optical")}
                    >
                      Optical Stream
                    </button>
                    <button
                      type="button"
                      className={`fc-btn ${elaMode === "ela" ? "active" : ""}`}
                      onClick={() => setElaMode("ela")}
                    >
                      ELA Heatmap
                    </button>
                  </div>
                </div>

                <div className="fc-canvas-wrap">
                  <svg viewBox="0 0 500 280" className="fc-svg" role="img" aria-label="Interactive forensic error level analysis display">
                    <defs>
                      <linearGradient id="optgrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#142C1E" />
                        <stop offset="100%" stopColor="#0B1A12" />
                      </linearGradient>
                      <radialGradient id="elaglow" cx="54%" cy="48%" r="35%">
                        <stop offset="0%" stopColor="#E5A93C" stopOpacity="0.85" />
                        <stop offset="45%" stopColor="#39D98A" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#06120B" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    <rect width="100%" height="100%" fill={elaMode === "optical" ? "url(#optgrad)" : "#050E09"} />

                    {/* Ambient forensic grid */}
                    <path d="M 0 70 L 500 70 M 0 140 L 500 140 M 0 210 L 500 210 M 125 0 L 125 280 M 250 0 L 250 280 M 375 0 L 375 280" stroke="#122B1E" strokeWidth="0.6" strokeDasharray="3 3" />

                    {elaMode === "optical" ? (
                      /* Optical view */
                      <g>
                        <path d="M 200 60 C 270 56, 310 90, 315 140 C 318 175, 298 200, 265 212 C 235 220, 210 215, 190 200 C 175 188, 168 165, 172 135 C 175 95, 185 64, 200 60 Z" fill="#193D2A" stroke="#2B6344" strokeWidth="1.5" />
                        <circle cx="230" cy="120" r="4" fill="#39D98A" />
                        <circle cx="275" cy="118" r="4" fill="#39D98A" />
                        <path d="M 245 135 L 260 145" stroke="#39D98A" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 235 170 C 250 178, 270 178, 282 168" fill="none" stroke="#39D98A" strokeWidth="1.5" />
                        <rect x="250" y="160" width="55" height="40" rx="3" fill="none" stroke="#E5A93C" strokeWidth="1.5" strokeDasharray="3 3" />
                        <text x="312" y="185" fill="#E5A93C" className="mono" fontSize="10">BOUNDARY ARTIFACT</text>
                      </g>
                    ) : (
                      /* ELA Error Level Analysis Residual View */
                      <g>
                        <rect width="100%" height="100%" fill="#040A06" opacity="0.9" />
                        <circle cx="275" cy="170" r="65" fill="url(#elaglow)" />
                        {/* High frequency residual noise dots */}
                        {Array.from({ length: 40 }).map((_, i) => (
                          <circle
                            key={i}
                            cx={240 + Math.sin(i * 1.7) * 45}
                            cy={145 + Math.cos(i * 2.3) * 35}
                            r={Math.max(1, (i % 3) * 1.2)}
                            fill={i % 2 === 0 ? "#E5A93C" : "#39D98A"}
                            opacity={0.7}
                          />
                        ))}
                        <path d="M 248 150 C 265 160, 285 168, 305 155" fill="none" stroke="#FF5C5C" strokeWidth="2.5" />
                        <rect x="240" y="140" width="70" height="46" rx="3" fill="none" stroke="#FF5C5C" strokeWidth="1.5" strokeDasharray="3 3" />
                        <text x="316" y="166" fill="#FF5C5C" className="mono" fontSize="10">RESIDUAL QUANTIZATION MISMATCH: +24.6 dB</text>
                      </g>
                    )}
                  </svg>
                </div>
                <div className="fc-caption mono">
                  <span>Exhibit A · video received by message, 14 Mar · Frame 214</span>
                  <span className="fc-state">{elaMode === "optical" ? "Mode: Normal Optical" : "Mode: High-Pass ELA Resampling"}</span>
                </div>
              </div>
            </div>

            {/* Step 4: Right interactive forensic discrete cosine transform artifact appears fourth */}
            <div className="s2-step s2-step-4">
              <div className="forensic-card">
                <div className="fc-topbar">
                  <div className="fc-meta mono">
                    <span className="fc-tag">SIGNAL ANALYSIS // QUANTIZATION MATRIX</span>
                    <span>DCT BLOCK INSPECTION</span>
                  </div>
                  <span className="badge-ok mono">SYNCHRONIZED</span>
                </div>

                <div className="dct-grid-wrap">
                  <div className="dct-grid">
                    {[
                      { freq: "DC (Luma)", val: "16", status: "ok" },
                      { freq: "Low-Pass 01", val: "11", status: "ok" },
                      { freq: "Low-Pass 02", val: "10", status: "ok" },
                      { freq: "Mid-Pass 03", val: "16", status: "ok" },
                      { freq: "Mid Edge 04", val: "24", status: "warn" },
                      { freq: "High Edge 05", val: "40", status: "warn" },
                      { freq: "Spatial 06", val: "51", status: "warn" },
                      { freq: "Chroma 07", val: "61", status: "err" },
                    ].map((item, idx) => (
                      <div key={idx} className={`dct-cell dct-${item.status}`}>
                        <span className="mono dct-lbl">{item.freq}</span>
                        <strong className="mono dct-val">{item.val}</strong>
                        <span className="mono dct-st">{item.status === "ok" ? "Nominal" : item.status === "warn" ? "Shift" : "Anomaly"}</span>
                      </div>
                    ))}
                  </div>

                  <div className="dct-readout mono">
                    <div className="dr-row">
                      <span>Discrete Cosine Transform:</span>
                      <strong style={{ color: "#E5A93C" }}>Non-uniform quantization on Frame 214</strong>
                    </div>
                    <div className="dr-row">
                      <span>Encoder Profile:</span>
                      <span>H.264 Main@L4.1 · CABAC Entropy</span>
                    </div>
                    <div className="dr-row">
                      <span>Container Integrity:</span>
                      <span className="badge-pass">MOOV Atom Verified</span>
                    </div>
                  </div>
                </div>

                <div className="fc-caption mono">
                  <span>Exhibit B · Quantization step variance across temporal slices</span>
                  <span className="badge-warn">FLAGGED FOR HUMAN REVIEW</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: CAPABILITIES (Redesigned with Deep Forest Palette & Interactive Workspaces) */}
        <section id="capabilities" className="capabilities-hub" aria-label="Capabilities">
          <div className="ch-inner">
            <div className="ch-header">
              <div className="ch-title-group">
                <span className="mono ch-tag">CORE CAPABILITIES</span>
                <h2>Forensic tools built for high-stakes scrutiny.</h2>
                <p className="ch-subtitle">
                  Examine indicators, contrast references, preserve cryptographic chain-of-custody, and compile unassailable evidence records.
                </p>
              </div>

              {/* Interactive Capability Switcher Tabs */}
              <div className="ch-tabs" role="tablist">
                {[
                  { id: 0, num: "01", label: "Frame Forensics", title: "Frame by frame" },
                  { id: 1, num: "02", label: "Comparative Analysis", title: "Side by side" },
                  { id: 2, num: "03", label: "Chain of Custody", title: "An investigation log" },
                  { id: 3, num: "04", label: "Evidence Dossier", title: "A readable report" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCap === tab.id}
                    className={`ch-tab-btn ${activeCap === tab.id ? "active" : ""}`}
                    onClick={() => setActiveCap(tab.id)}
                  >
                    <span className="mono tab-num">{tab.num}</span>
                    <span className="tab-lbl">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Capability Display Showcase */}
            <div className="ch-showcase">
              {/* CAPABILITY 1: FRAME BY FRAME */}
              {activeCap === 0 && (
                <div className="cap-panel-grid" role="tabpanel">
                  <div className="cap-info">
                    <span className="mono cap-num-pill">01 // TEMPORAL DECONSTRUCTION</span>
                    <h3>Frame by frame</h3>
                    <p className="cap-desc">
                      Examine suspicious video footage frame by frame with pixel-level precision. Haven decomposes container formats into uncompressed raw frames, highlighting boundary shifts, compression artifacts, and landmark tracking discrepancies.
                    </p>

                    <div className="cap-feature-list mono">
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Lossless keyframe & B-frame temporal extraction</span>
                      </div>
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Optical flow vector tracking across contiguous frames</span>
                      </div>
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Mark and tag regional discrepancies with microsecond timecodes</span>
                      </div>
                    </div>

                    <div className="cap-action-row">
                      <button type="button" className="btn-start" onClick={onEnterWorkspace}>
                        Open Frame Inspector
                      </button>
                    </div>
                  </div>

                  <div className="cap-interactive-stage">
                    <div className="cis-card">
                      <div className="cis-topbar mono">
                        <span>SESSION: 0417 · FRAME SCRUBBER</span>
                        <span className="badge-live">SELECTED: FRAME {selectedFrame}</span>
                      </div>

                      {/* Interactive frame scrubber preview */}
                      <div className="cis-preview">
                        <svg viewBox="0 0 460 260" className="cis-svg" role="img" aria-label="Interactive frame inspection viewer">
                          <defs>
                            <radialGradient id="frameglow" cx="60%" cy="50%" r="30%">
                              <stop offset="0%" stopColor="#39D98A" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#0B1A12" stopOpacity="0" />
                            </radialGradient>
                          </defs>
                          <rect width="100%" height="100%" fill="#08140E" />
                          <circle cx="270" cy="130" r="60" fill="url(#frameglow)" />
                          
                          {/* Face contour with varying distortion per frame */}
                          <path
                            d={`M 200 60 C ${240 + (selectedFrame - 214) * 3} 56, 290 85, 295 130 C 298 165, ${
                              275 + (selectedFrame === 214 ? 12 : 0)
                            } 190, 245 200 C 215 208, 190 200, 175 185 C 160 170, 155 145, 160 120 Z`}
                            fill="#11271B"
                            stroke="#2C573C"
                            strokeWidth="1.5"
                          />
                          
                          {/* Landmark nodes */}
                          <circle cx="215" cy="115" r="3" fill="#39D98A" />
                          <circle cx="260" cy="113" r="3" fill="#39D98A" />
                          <circle cx="240" cy="140" r="3" fill="#39D98A" />

                          {selectedFrame === 214 && (
                            <g>
                              <rect x="238" y="148" width="55" height="38" rx="2" fill="none" stroke="#E5A93C" strokeWidth="2" strokeDasharray="3 3" />
                              <text x="242" y="142" fill="#E5A93C" className="mono" fontSize="9">FRAME 214 ANOMALY</text>
                            </g>
                          )}
                        </svg>

                        <div className="cis-telemetry mono">
                          <div>TIME: <strong>00:07.{selectedFrame - 207 < 10 ? `0${selectedFrame - 207}` : selectedFrame - 207}</strong></div>
                          <div>STATUS: <strong style={{ color: selectedFrame === 214 ? "#E5A93C" : "#39D98A" }}>
                            {selectedFrame === 214 ? "DISCREPANCY DETECTED" : "CONSISTENT"}
                          </strong></div>
                        </div>
                      </div>

                      {/* Filmstrip selector */}
                      <div className="cis-filmstrip">
                        {[210, 211, 212, 213, 214, 215, 216, 217].map((f) => (
                          <button
                            key={f}
                            type="button"
                            className={`film-thumb ${selectedFrame === f ? "active" : ""} ${f === 214 ? "flagged" : ""}`}
                            onClick={() => setSelectedFrame(f)}
                          >
                            <span className="mono f-num">{f}</span>
                            {f === 214 && <span className="mono f-badge">!</span>}
                          </button>
                        ))}
                      </div>
                      <div className="cis-hint mono">
                        <span>Click filmstrip frames to scrub through temporal keyframes</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CAPABILITY 2: SIDE BY SIDE */}
              {activeCap === 1 && (
                <div className="cap-panel-grid" role="tabpanel">
                  <div className="cap-info">
                    <span className="mono cap-num-pill">02 // COMPARATIVE AUTHENTICITY</span>
                    <h3>Side by side</h3>
                    <p className="cap-desc">
                      Align submitted media directly against verified reference assets or earlier timestamps. Drag the comparison splitter to inspect edge alignment, optical distortion, sensor pattern noise, and lighting disparities.
                    </p>

                    <div className="cap-feature-list mono">
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Interactive split-diff slider with synchronized zoom</span>
                      </div>
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Discrete compression profile comparison (quantization tables)</span>
                      </div>
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Color temperature and illumination vector consistency check</span>
                      </div>
                    </div>

                    <div className="cap-action-row">
                      <button type="button" className="btn-start" onClick={onEnterWorkspace}>
                        Compare Assets
                      </button>
                    </div>
                  </div>

                  <div className="cap-interactive-stage">
                    <div className="cis-card">
                      <div className="cis-topbar mono">
                        <span>COMPARISON ENGINE · DRAG SLIDER TO INSPECT</span>
                        <span>SPLIT: {comparisonSplit}%</span>
                      </div>

                      <div className="comparison-slider-container">
                        <div className="cs-view-wrap">
                          {/* Reference layer (left) */}
                          <div className="cs-layer cs-ref">
                            <svg viewBox="0 0 460 260" className="cs-svg">
                              <rect width="100%" height="100%" fill="#07170E" />
                              <text x="24" y="36" fill="#39D98A" className="mono" fontSize="11">VERIFIED REFERENCE ASSET</text>
                              {/* Clean reference face */}
                              <path d="M 200 60 C 240 56, 280 85, 285 130 C 288 165, 265 190, 240 200 C 215 208, 190 200, 175 185 C 160 170, 155 145, 160 120 Z" fill="#122E1E" stroke="#39D98A" strokeWidth="1.5" />
                              <path d="M 235 160 C 248 165, 260 165, 270 156" fill="none" stroke="#39D98A" strokeWidth="1.8" />
                              <text x="24" y="235" fill="#88A092" className="mono" fontSize="10">Source: Original Broadcast · 24.00 fps</text>
                            </svg>
                          </div>

                          {/* Submitted layer (right, clipped by slider) */}
                          <div
                            className="cs-layer cs-sub"
                            style={{ clipPath: `inset(0 0 0 ${comparisonSplit}%)` }}
                          >
                            <svg viewBox="0 0 460 260" className="cs-svg">
                              <rect width="100%" height="100%" fill="#141C16" />
                              <text x="24" y="36" fill="#E5A93C" className="mono" fontSize="11">SUBMITTED SUSPICIOUS FILE</text>
                              {/* Spliced submitted face with jagged jaw artifact */}
                              <path d="M 200 60 C 240 56, 280 85, 285 130 C 298 168, 280 195, 245 200 C 215 208, 190 200, 175 185 C 160 170, 155 145, 160 120 Z" fill="#202A22" stroke="#E5A93C" strokeWidth="1.5" />
                              <path d="M 235 160 C 255 174, 275 170, 285 156" fill="none" stroke="#FF5C5C" strokeWidth="2.5" />
                              <rect x="250" y="152" width="50" height="30" fill="none" stroke="#FF5C5C" strokeWidth="1.5" strokeDasharray="2 2" />
                              <text x="24" y="235" fill="#E5A93C" className="mono" fontSize="10">Discrepancy: Edge Halo & Quantization Gap</text>
                            </svg>
                          </div>

                          {/* Slider divider */}
                          <div className="cs-divider" style={{ left: `${comparisonSplit}%` }}>
                            <div className="cs-handle mono">‹ ›</div>
                          </div>
                        </div>

                        {/* Native slider control */}
                        <div className="cs-scrubber-row">
                          <span className="mono">Reference</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={comparisonSplit}
                            onChange={(e) => setComparisonSplit(Number(e.target.value))}
                            className="cs-range-input"
                            aria-label="Comparison split position"
                          />
                          <span className="mono">Submitted File</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CAPABILITY 3: EVIDENCE DOCUMENTATION & CHAIN OF CUSTODY */}
              {activeCap === 2 && (
                <div className="cap-panel-grid" role="tabpanel">
                  <div className="cap-info">
                    <span className="mono cap-num-pill">03 // IMMUTABLE AUDIT TRAIL</span>
                    <h3>An investigation log</h3>
                    <p className="cap-desc">
                      Every observation, hash calculation, frame capture, and manual context note is permanently stamped into an immutable audit ledger. Verify cryptographic provenance so evidence remains tamper-evident and court-admissible.
                    </p>

                    <div className="cap-feature-list mono">
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Cryptographic SHA-256 asset hash computed at ingest</span>
                      </div>
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Chronological event log with microsecond UTC timestamps</span>
                      </div>
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Analyst context attachment for witness provenance</span>
                      </div>
                    </div>

                    <div className="cap-action-row">
                      <button type="button" className="btn-start" onClick={handleCopyHash}>
                        {copiedHash ? "✓ Hash Copied" : "Copy Cryptographic Hash"}
                      </button>
                    </div>
                  </div>

                  <div className="cap-interactive-stage">
                    <div className="cis-card">
                      <div className="cis-topbar mono">
                        <span>IMMUTABLE EVIDENCE LEDGER</span>
                        <span className="badge-pass">CHAIN: SECURE</span>
                      </div>

                      <div className="audit-ledger-list mono">
                        {[
                          { time: "14 Mar 09:12:04 UTC", title: "Asset Ingested & Hashed", desc: "SHA-256: 9f3a8b2c4d1e7f093125a6e8b4c2d1e0f7a9c3e5...", status: "ok" },
                          { time: "14 Mar 09:14:18 UTC", title: "Frame Decomposition Finished", desc: "214 frames isolated at lossless PNG quantization", status: "ok" },
                          { time: "14 Mar 09:22:31 UTC", title: "Frame 214 Landmark Tagged", desc: "Region 2 marked: jaw contour deviation of +18.4%", status: "warn" },
                          { time: "14 Mar 09:31:05 UTC", title: "Analyst Note Appended", desc: "Boundary compression differs from surrounding video sequence", status: "warn" },
                          { time: "14 Mar 09:47:40 UTC", title: "Source Metadata Verified", desc: "EXIF & C2PA manifest absent; container timestamp preserved", status: "ok" },
                        ].map((item, idx) => (
                          <div key={idx} className={`audit-entry audit-${item.status}`}>
                            <div className="ae-time">{item.time}</div>
                            <div className="ae-body">
                              <strong className="ae-title">{item.title}</strong>
                              <span className="ae-desc">{item.desc}</span>
                            </div>
                            <span className={`ae-badge ae-b-${item.status}`}>{item.status === "ok" ? "VERIFIED" : "FLAGGED"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CAPABILITY 4: READABLE EVIDENCE REPORT */}
              {activeCap === 3 && (
                <div className="cap-panel-grid" role="tabpanel">
                  <div className="cap-info">
                    <span className="mono cap-num-pill">04 // LEGAL & PLATFORM EXPORT</span>
                    <h3>A readable report</h3>
                    <p className="cap-desc">
                      Synthesize complex technical forensics into clear, structured, readable reports. Formatted specifically for submission to social media platforms, legal counsel, institutional support hotlines, and law enforcement agencies.
                    </p>

                    <div className="cap-feature-list mono">
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Objective indicator summary avoiding exaggerated claims</span>
                      </div>
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Embedded high-resolution figure crops with callout annotations</span>
                      </div>
                      <div className="cfl-item">
                        <span className="cfl-dot" />
                        <span>Exportable tamper-evident PDF dossier with verification QR link</span>
                      </div>
                    </div>

                    <div className="cap-action-row">
                      <button type="button" className="btn-start" onClick={onEnterWorkspace}>
                        Generate Sample Report
                      </button>
                    </div>
                  </div>

                  <div className="cap-interactive-stage">
                    <div className="dossier-preview-card">
                      <div className="dpc-header">
                        <div className="dpc-title-row">
                          <div>
                            <span className="mono dpc-tag">OFFICIAL HAVEN REPORT</span>
                            <h4 className="dpc-heading">Evidence Dossier: Case 0417</h4>
                          </div>
                          <span className="badge-pass mono">CERTIFIED HASH</span>
                        </div>

                        {/* Interactive Report Sub-tabs */}
                        <div className="dpc-tabs mono">
                          <button
                            type="button"
                            className={`dpc-tab-btn ${activeReportTab === "summary" ? "active" : ""}`}
                            onClick={() => setActiveReportTab("summary")}
                          >
                            Executive Summary
                          </button>
                          <button
                            type="button"
                            className={`dpc-tab-btn ${activeReportTab === "indicators" ? "active" : ""}`}
                            onClick={() => setActiveReportTab("indicators")}
                          >
                            Key Indicators (3)
                          </button>
                          <button
                            type="button"
                            className={`dpc-tab-btn ${activeReportTab === "metadata" ? "active" : ""}`}
                            onClick={() => setActiveReportTab("metadata")}
                          >
                            File Provenance
                          </button>
                        </div>
                      </div>

                      <div className="dpc-body">
                        {activeReportTab === "summary" && (
                          <div className="dpc-content">
                            <p className="dpc-lead">
                              One video file (<code>interview_clip_0417.mp4</code>) was examined across 214 individual keyframes. Analysis identified localized compression anomalies along the facial perimeter in frames 212–219. Observations establish technical indicators without making unsubstantiated authenticity claims.
                            </p>
                            <div className="dpc-stat-grid mono">
                              <div className="dpc-stat">
                                <span className="stat-label">File Integrity:</span>
                                <strong className="stat-val text-green">Verified SHA-256</strong>
                              </div>
                              <div className="dpc-stat">
                                <span className="stat-label">Flagged Regions:</span>
                                <strong className="stat-val text-warn">2 Marked for Review</strong>
                              </div>
                              <div className="dpc-stat">
                                <span className="stat-label">Container Stream:</span>
                                <strong className="stat-val">H.264 / AAC Re-encoded</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeReportTab === "indicators" && (
                          <div className="dpc-content mono">
                            <div className="indicator-row ind-warn">
                              <span className="ind-name">01 · Jaw Contour Discontinuity</span>
                              <span className="ind-desc">Resampling delta exceeds nominal baseline by +18.4%</span>
                              <span className="badge-warn">REQUIRES REVIEW</span>
                            </div>
                            <div className="indicator-row ind-warn">
                              <span className="ind-name">02 · Quantization Step Inconsistency</span>
                              <span className="ind-desc">DCT high-frequency coefficients mismatch container tables</span>
                              <span className="badge-warn">INCONSISTENT</span>
                            </div>
                            <div className="indicator-row ind-pass">
                              <span className="ind-name">03 · Audio-Video Synchronization</span>
                              <span className="ind-desc">Phoneme-to-viseme timing consistent with reference</span>
                              <span className="badge-pass">CONSISTENT</span>
                            </div>
                          </div>
                        )}

                        {activeReportTab === "metadata" && (
                          <div className="dpc-content mono dpc-meta-table">
                            <div className="dmt-row"><span>Filename</span><strong>interview_clip_0417.mp4</strong></div>
                            <div className="dmt-row"><span>Ingest Timestamp</span><strong>2026-03-14 09:12:04 UTC</strong></div>
                            <div className="dmt-row"><span>Cryptographic Hash</span><strong className="hash-wrap">9f3a8b2c4d1e7f093125a6e8b4c2d1e0f7a9c3e5...</strong></div>
                            <div className="dmt-row"><span>Resolution & Codec</span><strong>1920×1080 @ 29.97 fps (H.264 Main@L4.1)</strong></div>
                          </div>
                        )}
                      </div>

                      <div className="dpc-footer mono">
                        <span>CONFIDENTIAL EVIDENCE RECORD · PREPARED VIA HAVEN</span>
                        <span>EXPORT FORMAT: PDF/A-2b</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 4: HOW HAVEN WORKS (Interactive 5-Stage Investigative Pipeline) */}
        <section id="how" className="how-interactive" aria-label="How Haven works">
          <div className="hw-inner">
            <div className="hw-header">
              <span className="mono hw-tag">INVESTIGATIVE WORKFLOW</span>
              <h2>How Haven works</h2>
              <p className="hw-subtitle">
                A deliberate, reproducible 5-stage pipeline designed to preserve chain of custody and make media scrutiny plain and actionable.
              </p>
            </div>

            {/* Interactive Pipeline Navigator */}
            <div className="pipeline-nav">
              {[
                { step: 1, title: "Drop the file", subtitle: "Ingest & Hash" },
                { step: 2, title: "Examine frame by frame", subtitle: "Temporal Scan" },
                { step: 3, title: "Review what it found", subtitle: "Indicator Triage" },
                { step: 4, title: "Add what you know", subtitle: "Context Notes" },
                { step: 5, title: "Export the record", subtitle: "Compiled Dossier" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  className={`pipe-step-btn ${activeWorkflowStep === s.step ? "active" : ""}`}
                  onClick={() => setActiveWorkflowStep(s.step)}
                >
                  <span className="mono pipe-num">STAGE 0{s.step}</span>
                  <strong className="pipe-title">{s.title}</strong>
                  <span className="pipe-sub">{s.subtitle}</span>
                </button>
              ))}
            </div>

            {/* Active Stage Interactive Console */}
            <div className="pipeline-console">
              <div className="pc-card">
                <div className="pc-topbar mono">
                  <div className="pc-indicator">
                    <span className="pipe-pulse" />
                    <span>ACTIVE STAGE 0{activeWorkflowStep} OF 05</span>
                  </div>
                  <div className="pc-nav-arrows">
                    <button
                      type="button"
                      disabled={activeWorkflowStep === 1}
                      onClick={() => setActiveWorkflowStep((prev) => Math.max(1, prev - 1))}
                      className="pc-arrow-btn"
                      aria-label="Previous step"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      disabled={activeWorkflowStep === 5}
                      onClick={() => setActiveWorkflowStep((prev) => Math.min(5, prev + 1))}
                      className="pc-arrow-btn"
                      aria-label="Next step"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                <div className="pc-grid">
                  <div className="pc-description">
                    {activeWorkflowStep === 1 && (
                      <>
                        <span className="mono pc-phase-label">PHASE 01 // CUSTODY INITIATION</span>
                        <h3>Drop the file</h3>
                        <p>
                          Bring in the image or video you want to examine. The moment your file touches Haven, the system computes a SHA-256 cryptographic digest before any processing begins. This establishes an unalterable proof of what was received.
                        </p>
                        <div className="pc-highlights mono">
                          <div>✓ Zero cloud re-encoding during ingest</div>
                          <div>✓ SHA-256 cryptographic hash calculated locally</div>
                          <div>✓ File attributes & timestamps immutably logged</div>
                        </div>
                      </>
                    )}

                    {activeWorkflowStep === 2 && (
                      <>
                        <span className="mono pc-phase-label">PHASE 02 // KEYFRAME DECOMPOSITION</span>
                        <h3>Examine frame by frame</h3>
                        <p>
                          The file opens one frame at a time. Haven strips temporal inter-frame compression to isolate raw pixels, enabling systematic scrubbing through microsecond intervals to catch anomalies invisible at standard playback speed.
                        </p>
                        <div className="pc-highlights mono">
                          <div>✓ Full-frame spatial resolution extraction</div>
                          <div>✓ Frame-by-frame scrubbing with timeline ruler</div>
                          <div>✓ Zero temporal interpolation artifact bleed</div>
                        </div>
                      </>
                    )}

                    {activeWorkflowStep === 3 && (
                      <>
                        <span className="mono pc-phase-label">PHASE 03 // DISCREPANCY DETECTION</span>
                        <h3>Review what it found</h3>
                        <p>
                          Haven shows you the indicators. Review Error Level Analysis heatmaps, discrete cosine transform anomalies, and facial landmark tracks. Findings are categorized clearly so you decide what matters without inflated false promises.
                        </p>
                        <div className="pc-highlights mono">
                          <div>✓ Quantization step mismatch indicators</div>
                          <div>✓ High-pass resampling error heatmaps</div>
                          <div>✓ Plain, honest language avoiding certainty claims</div>
                        </div>
                      </>
                    )}

                    {activeWorkflowStep === 4 && (
                      <>
                        <span className="mono pc-phase-label">PHASE 04 // WITNESS PROVENANCE</span>
                        <h3>Add what you know</h3>
                        <p>
                          Write in context Haven can't see — when you got the media, who sent it, platform source URLs, and accompanying threatening demands. Context turns technical anomalies into a cohesive, actionable narrative.
                        </p>
                        <div className="pc-highlights mono">
                          <div>✓ Chronological contextual incident notes</div>
                          <div>✓ Communication platform metadata capture</div>
                          <div>✓ Preserved intact with cryptographic chain</div>
                        </div>
                      </>
                    )}

                    {activeWorkflowStep === 5 && (
                      <>
                        <span className="mono pc-phase-label">PHASE 05 // ACTIONABLE EXPORT</span>
                        <h3>Export the record</h3>
                        <p>
                          One structured document with everything in one place. Export an institutional-grade PDF dossier containing technical metrics, high-resolution annotated crops, full hash verification, and timeline notes ready for legal counsel.
                        </p>
                        <div className="pc-highlights mono">
                          <div>✓ Standardized PDF/A format for legal submission</div>
                          <div>✓ High-resolution annotated figure exhibits</div>
                          <div>✓ Verifiable cryptographic proof certificate</div>
                        </div>
                      </>
                    )}

                    <div className="pc-action">
                      <button type="button" className="btn-start" onClick={onEnterWorkspace}>
                        Start Examination
                      </button>
                    </div>
                  </div>

                  <div className="pc-display-preview">
                    {activeWorkflowStep === 1 && (
                      <div className="pdp-terminal mono">
                        <div className="pdp-line text-green">$ haven ingest --file interview_clip_0417.mp4</div>
                        <div className="pdp-line">→ Parsing container header: MP4 (ISO/IEC 14496-14)</div>
                        <div className="pdp-line">→ Calculating SHA-256 digest...</div>
                        <div className="pdp-line hl-green">✓ SHA-256: 9f3a8b2c4d1e7f093125a6e8b4c2d1e0f7a9c3e5...</div>
                        <div className="pdp-line">→ Custody record locked at 2026-03-14 09:12:04 UTC</div>
                        <div className="pdp-line text-green">✓ Ready for temporal deconstruction</div>
                      </div>
                    )}

                    {activeWorkflowStep === 2 && (
                      <div className="pdp-frame-rack mono">
                        <div className="pfr-header">
                          <span>LOSSLESS FRAME EXTRACTION // 214 FRAMES</span>
                          <span className="badge-live">29.97 FPS</span>
                        </div>
                        <div className="pfr-grid">
                          {[211, 212, 213, 214, 215, 216].map((fr) => (
                            <div key={fr} className={`pfr-cell ${fr === 214 ? "flagged" : ""}`}>
                              <span className="pfr-label">FR {fr}</span>
                              <div className="pfr-box">
                                <span className="pfr-dot" />
                              </div>
                              <span className="pfr-tc">00:07.{fr - 207}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pdp-caption">
                          <span>Frame 214 isolated with high-contrast edge discrepancy</span>
                        </div>
                      </div>
                    )}

                    {activeWorkflowStep === 3 && (
                      <div className="pdp-indicators mono">
                        <div className="pi-item pi-warn">
                          <span className="pi-tag">FLAGGED INDICATOR</span>
                          <strong>Jaw Contour Resampling Delta (+18.4%)</strong>
                          <span className="pi-note">High-pass noise discontinuity detected on Frame 214</span>
                        </div>
                        <div className="pi-item pi-warn">
                          <span className="pi-tag">FLAGGED INDICATOR</span>
                          <strong>Quantization Matrix Deviation</strong>
                          <span className="pi-note">DCT coefficients differ from standard H.264 profile</span>
                        </div>
                        <div className="pi-item pi-pass">
                          <span className="pi-tag">NOMINAL</span>
                          <strong>Audio Stream Waveform Continuity</strong>
                          <span className="pi-note">Zero splice gaps detected in primary stereo track</span>
                        </div>
                      </div>
                    )}

                    {activeWorkflowStep === 4 && (
                      <div className="pdp-notes mono">
                        <div className="pn-header">INVESTIGATOR WITNESS TIMELINE</div>
                        <div className="pn-entry">
                          <span className="pn-time">09:14 UTC</span>
                          <p>File received via encrypted messaging app from unknown account.</p>
                        </div>
                        <div className="pn-entry">
                          <span className="pn-time">09:22 UTC</span>
                          <p>Blackmail threat demand attached to video link. Preserving original timestamp.</p>
                        </div>
                        <div className="pn-entry highlight">
                          <span className="pn-time">09:31 UTC</span>
                          <p>Frame 214 flagged for artificial jawline edge blending inconsistent with source.</p>
                        </div>
                      </div>
                    )}

                    {activeWorkflowStep === 5 && (
                      <div className="pdp-dossier-card mono">
                        <div className="pdc-badge">HAVEN FORENSIC DOSSIER // READY</div>
                        <h4>REPORT_CASE_0417_FINAL.PDF</h4>
                        <div className="pdc-rows">
                          <div><span>Pages:</span> <strong>6 Pages (PDF/A-2b)</strong></div>
                          <div><span>Cryptographic Stamp:</span> <strong>HMAC-SHA256 Verified</strong></div>
                          <div><span>Audience:</span> <strong>Platform Abuse / Legal Counsel</strong></div>
                          <div><span>Status:</span> <strong className="text-green">Ready for Download</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FINAL CTA */}
        <section id="cta" className="cta" aria-label="Get started">
          <div className="cta-inner">
            <div className="cta-left">
              <h2 className="rv">Start with the file you have.</h2>
              <p className="rv">Open it here. Haven examines what it can and helps you build a record.</p>
              <button type="button" className="btn-start rv" onClick={onEnterWorkspace}>
                Open Haven
              </button>
            </div>
            <div className="cta-right" aria-hidden="true">
              <div className="cta-visual">
                <div className="cv-line">$ haven examine interview_clip_0417.mp4</div>
                <div className="cv-line hl">→ file received</div>
                <div className="cv-line">→ hash recorded · SHA-256 9f3a…c71e</div>
                <div className="cv-line hl">→ examining frames</div>
                <div className="cv-line">→ indicators noted · 2 regions flagged</div>
                <div className="cv-line hl">→ record built</div>
                <div className="cv-line">→ export ready · report_0417.pdf</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 6: EDITORIAL FOOTER */}
      <footer>
        <div className="fgrid">
          <div className="fc">
            <h4>Explore</h4>
            <a href="#top">Home</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#how">How it works</a>
          </div>
          <div className="fc">
            <h4>Support Resources</h4>
            <a href="https://takeitdown.ncmec.org" target="_blank" rel="noopener noreferrer">
              Take It Down (NCMEC)
            </a>
            <a href="https://stopncii.org" target="_blank" rel="noopener noreferrer">
              StopNCII.org
            </a>
            <a href="https://www.cybercivilrights.org" target="_blank" rel="noopener noreferrer">
              Cyber Civil Rights Initiative
            </a>
          </div>
          <div className="fc">
            <h4>Repository</h4>
            <a href="https://github.com/anooshyniazi01/Haven" target="_blank" rel="noopener noreferrer">
              GitHub Repository
            </a>
            <a href="#top">Security Specification</a>
            <a href="#top">Privacy Architecture</a>
          </div>
        </div>
        <div className="bot cap">
          <span>© 2026 Haven. All rights reserved.</span>
          <nav>
            <a href="#top">Privacy Notice</a>
            <a href="#top">Terms of Use</a>
          </nav>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
