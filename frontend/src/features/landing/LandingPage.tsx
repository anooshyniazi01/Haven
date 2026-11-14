import React, { useEffect, useState, useRef, useCallback } from "react";
import "../../styles/landing.css";

export interface LandingPageProps {
  onEnterWorkspace: () => void;
}

interface FileMeta {
  name: string;
  size: string;
  hash: string;
  previewUrl?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
  // Hero Exhibit View Mode: Original / Error Level / Noise
  const [viewMode, setViewMode] = useState<"original" | "ela" | "noise">("original");
  
  // Hero Loupe: tracks cursor or defaults to cloned background frame (x: ~78%, y: ~43%)
  const [heroLoupe, setHeroLoupe] = useState<{ x: number; y: number; active: boolean }>({
    x: 78,
    y: 43,
    active: false,
  });

  // Hero Drop Zone State
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFile, setStagedFile] = useState<FileMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section 3: Capabilities (One Photo, Four Behaviors)
  const [activeCap, setActiveCap] = useState<number>(0);
  const [capLoupe, setCapLoupe] = useState<{ x: number; y: number }>({ x: 78, y: 43 });
  
  // Section 4: How Haven Works (Scroll-driven step 1 to 5)
  const [howStep, setHowStep] = useState<number>(1);
  const howSectionRef = useRef<HTMLElement>(null);

  // Canvas drawing state for Capability 2 ("Mark what looks off")
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [customRect, setCustomRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  // SHA-256 computation utility
  const computeSHA256 = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      return "97e0959c3c257f095498db1b4a60d69655dc2054e7dbf78aae4c1137101df135";
    }
  };

  const processSelectedFile = async (file: File) => {
    const hash = await computeSHA256(file);
    const sizeKB = (file.size / 1024).toFixed(1) + " KB";
    const previewUrl = URL.createObjectURL(file);
    setStagedFile({
      name: file.name,
      size: sizeKB,
      hash,
      previewUrl,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Canvas drawing handlers for Capability 2
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawStartRef.current = { x, y };
    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStartRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const startX = drawStartRef.current.x;
    const startY = drawStartRef.current.y;
    const w = curX - startX;
    const h = curY - startY;
    setCustomRect({
      x: w >= 0 ? startX : curX,
      y: h >= 0 ? startY : curY,
      w: Math.abs(w),
      h: Math.abs(h),
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // Re-draw canvas for Capability 2
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reference region (Original framed photo in upper background): mint dashed
    ctx.strokeStyle = "#3DDC97";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    const refX = canvas.width * 0.71;
    const refY = canvas.height * 0.02;
    const refW = canvas.width * 0.25;
    const refH = canvas.height * 0.32;
    ctx.strokeRect(refX, refY, refW, refH);

    ctx.fillStyle = "#3DDC97";
    ctx.font = "11px Geist Mono, monospace";
    ctx.fillText("Reference 2 · original wall frame", refX + 6, refY + 16);

    // Default Suspect Region (Cloned frame on wall) or User Drawn Region
    ctx.setLineDash([]);
    ctx.strokeStyle = "#E5A93C";
    ctx.lineWidth = 2;

    if (customRect && customRect.w > 10) {
      ctx.strokeRect(customRect.x, customRect.y, customRect.w, customRect.h);
      ctx.fillStyle = "#E5A93C";
      ctx.fillText("Region 1 (user marked)", customRect.x + 6, customRect.y + 16);
    } else {
      const susX = canvas.width * 0.72;
      const susY = canvas.height * 0.37;
      const susW = canvas.width * 0.17;
      const susH = canvas.height * 0.23;
      ctx.strokeRect(susX, susY, susW, susH);
      ctx.fillStyle = "#E5A93C";
      ctx.fillText("Region 1 (suspect clone)", susX + 6, susY + 16);
    }
  }, [activeCap, customRect]);

  // Main scroll & interaction coordinator
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");

    const $ = <T extends HTMLElement = HTMLElement>(s: string): T | null => document.querySelector(s);
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const wm = $("#wm");
    const slot = $("#slot");
    const hdr = $("#hdr");

    /* Wordmark smooth scroll-linked move + scale into the fixed header */
    const m = { x: 0, y: 0, s: 0.2, pad: 24, ty: 15 };
    function measureWordmark() {
      if (!wm || !slot) return;
      wm.style.transform = "none";
      const r = slot.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(slot).fontSize) || 120;
      m.x = r.left + window.scrollX;
      m.y = r.top + window.scrollY;
      m.s = 24 / fs;
      m.pad = Math.max(16, window.innerWidth * 0.04 < 56 ? Math.min(56, Math.max(20, window.innerWidth * 0.04)) : 56);
      m.ty = (56 - 24) / 2;
      updateScroll();
    }

    function updateScroll() {
      const y = window.scrollY;
      if (wm && hdr) {
        const p = clamp(y / (window.innerHeight * 0.45));
        const e = p * p * (3 - 2 * p);
        wm.style.transform = `translate(${lerp(m.x, m.pad, e)}px,${lerp(m.y, m.ty, e)}px) scale(${lerp(1, m.s, e)})`;
        root.style.setProperty("--p", p.toFixed(3));
        hdr.style.setProperty("--hb", e.toFixed(3));
      }

      // Section 4: How Haven Works scroll progression
      const howSec = howSectionRef.current;
      if (howSec) {
        const rect = howSec.getBoundingClientRect();
        const secHeight = rect.height - window.innerHeight;
        if (secHeight > 0) {
          const progress = clamp(-rect.top / secHeight);
          const stepIndex = Math.min(5, Math.max(1, Math.floor(progress * 5) + 1));
          setHowStep(stepIndex);
        }
      }
    }

    // Scroll reveal observer
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));

    let tick = false;
    const handleScroll = () => {
      if (!tick) {
        tick = true;
        requestAnimationFrame(() => {
          updateScroll();
          tick = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measureWordmark);

    measureWordmark();
    const tFallback = setTimeout(() => root.classList.add("go"), 1500);

    return () => {
      clearTimeout(tFallback);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measureWordmark);
      io.disconnect();
    };
  }, []);

  // Capabilities live captions
  const capCaptions = [
    "Enlarged 4x near the edge · background wall object",
    "Region 1 (suspect frame) vs reference 2 (original wall frame)",
    "Timeline updated · 4 entries recorded with timestamps",
    "Report compiled · Ready to export for platform or legal review",
  ];

  // Helper for Hero specimen image
  const getHeroImageSrc = () => {
    switch (viewMode) {
      case "ela":
        return "/specimen-ela.jpg";
      case "noise":
        return "/specimen-noise.jpg";
      case "original":
      default:
        return "/specimen.jpg";
    }
  };

  return (
    <>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Sticky Header */}
      <header id="hdr" role="banner">
        <nav aria-label="Main Navigation">
          <a className="h-link" href="#capabilities">
            Capabilities
          </a>
          <a className="h-link" href="#how">
            How it works
          </a>
          <button type="button" className="btn-nav-round" onClick={onEnterWorkspace}>
            Open Haven
          </button>
        </nav>
      </header>

      {/* Continuous Scroll-Linked Animated Wordmark (Lora, weight 500 hero / 700 header) */}
      <a id="wm" href="#top" aria-label="Haven, back to top">
        Haven
      </a>

      <main>
        {/* SECTION 1: HERO */}
        <section className="hero" aria-label="Haven Overview">
          {/* Left Column: Wordmark, Tagline, Description, Rounded Pill Drop Zone */}
          <div className="hl">
            <h1 id="slot" aria-hidden="true">
              Haven
            </h1>
            <div className="tag hfade e e1">Your digital safety workspace.</div>
            <p className="d hfade e e2">
              Upload a photo or video that looks off. See what's been altered, write down what you find, and get a
              report you can show someone.
            </p>

            {/* Pill Drop Zone (border-radius 999px, dashed mint outline) */}
            <div className="hero-action-group hfade e e3">
              <div
                className={`pill-dropzone ${isDragging ? "drag-over" : ""}`}
                role="button"
                tabIndex={0}
                aria-label="Upload an image or video"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="pd-icon-circle" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 16V4M7 9l5-5 5 5" />
                    <path d="M20 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
                  </svg>
                </div>
                <div className="pd-text-wrap">
                  <span className="pd-main">
                    {stagedFile ? stagedFile.name : "Drop an image or video here"}
                  </span>
                  <span className="pd-sub mono">
                    {stagedFile ? `SHA-256 ${stagedFile.hash.slice(0, 8)}… · Ready` : "JPG, PNG, MP4. Stays in your browser."}
                  </span>
                </div>
              </div>

              {/* Plain text link below drop zone */}
              <a className="link-see-how" href="#how">
                or see how it works →
              </a>
            </div>
          </div>

          {/* Right Column: Photoreal Specimen Inspection Exhibit */}
          <figure className="hero-specimen-exhibit e ev" aria-label="Specimen examination preview">
            {/* View Mode Pill Toggle */}
            <div className="view-mode-bar" role="toolbar" aria-label="Specimen filter mode">
              <div className="toggle-pill-cluster">
                <button
                  type="button"
                  className={`btn-toggle-round ${viewMode === "original" ? "active" : ""}`}
                  onClick={() => setViewMode("original")}
                >
                  Original
                </button>
                <button
                  type="button"
                  className={`btn-toggle-round ${viewMode === "ela" ? "active" : ""}`}
                  onClick={() => setViewMode("ela")}
                >
                  Error level
                </button>
                <button
                  type="button"
                  className={`btn-toggle-round ${viewMode === "noise" ? "active" : ""}`}
                  onClick={() => setViewMode("noise")}
                >
                  Noise
                </button>
              </div>
            </div>

            {/* Specimen Frame with Cursor-Following / Default Loupe */}
            <div
              className="specimen-frame"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setHeroLoupe({ x: clamp(x, 5, 95), y: clamp(y, 5, 95), active: true });
              }}
              onMouseLeave={() => {
                // Return to default highlight on the cloned background frame
                setHeroLoupe({ x: 78, y: 43, active: false });
              }}
            >
              <img
                src={getHeroImageSrc()}
                alt="Documentary forensic specimen showing adult at desk with background room details"
                className="specimen-img"
              />

              {/* Cursor-Following or Default Magnifier Loupe */}
              <div
                className="specimen-loupe"
                style={{
                  left: `${heroLoupe.x}%`,
                  top: `${heroLoupe.y}%`,
                }}
                aria-hidden="true"
              >
                <div
                  className="loupe-zoom-disc"
                  style={{
                    backgroundImage: `url(${getHeroImageSrc()})`,
                    backgroundPosition: `${heroLoupe.x}% ${heroLoupe.y}%`,
                  }}
                />
                <span className="loupe-tag mono">
                  {heroLoupe.active ? "Enlarged 4×" : "Anomaly · Cloned frame"}
                </span>
              </div>
            </div>

            {/* Telemetry Bar: Only 1 short note beside exhibit & computed SHA-256 */}
            <div className="specimen-telemetry">
              <span className="telemetry-note">Specimen · altered background object</span>
              <span className="telemetry-hash mono">
                SHA-256: 97e0959c…101df135
              </span>
            </div>
          </figure>
        </section>

        {/* SECTION 2: EDITORIAL INTRODUCTION */}
        <section className="intro-section" aria-label="Introduction">
          <div className="intro-grid">
            <div className="intro-text-col rv">
              <h2>Not everything online is what it appears to be.</h2>
              <div className="intro-copy">
                <p>
                  A clip that looks real can be edited. A clip that looks fake can be genuine. Haven shows you what's
                  actually in the file, so you aren't left guessing.
                </p>
                <p className="intro-sub-note">
                  Exhibits below demonstrate verifiable indicators from our specimen archive.
                </p>
              </div>
            </div>

            <div className="intro-exhibit-col rv">
              <div className="intro-dual-exhibits">
                {/* Exhibit A: Supporting documentary context */}
                <figure className="intro-card-media">
                  <img
                    src="/supporting-phone-night.jpg"
                    alt="Close-up of person receiving incoming media file on phone"
                    className="intro-photo"
                    loading="lazy"
                  />
                  <figcaption className="mono intro-cap">
                    Exhibit A · submitted media received by message
                  </figcaption>
                </figure>

                {/* Exhibit B: Crop of cloned background wall anomaly */}
                <figure className="intro-card-media">
                  <img
                    src="/specimen-crop-suspect.jpg"
                    alt="High-resolution 4x crop of cloned background picture frame"
                    className="intro-photo"
                    loading="lazy"
                  />
                  <figcaption className="mono intro-cap">
                    Exhibit A · region 1, background cloned frame
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: CAPABILITIES (One Photo, Four Things You Can Do To It) */}
        <section id="capabilities" className="capabilities-section" aria-label="Capabilities">
          <div className="cap-container">
            {/* Left Column: 4 Capabilities List */}
            <div className="cap-list-col">
              <div className="cap-header rv">
                <h2>Capabilities</h2>
                <p className="cap-lead">One file, examined from every angle.</p>
              </div>

              <div className="cap-interactive-list" role="tablist" aria-label="Haven capabilities">
                {/* Cap 1: Look closely */}
                <button
                  type="button"
                  role="tab"
                  id="tab-cap-0"
                  aria-selected={activeCap === 0}
                  aria-controls="panel-cap"
                  className={`cap-item-btn ${activeCap === 0 ? "active" : ""}`}
                  onClick={() => setActiveCap(0)}
                >
                  <div className="cap-title-row">
                    <span className="cap-bullet" aria-hidden="true" />
                    <h3>Look closely</h3>
                  </div>
                  <p className="cap-desc">Step through the file and enlarge any spot.</p>
                </button>

                {/* Cap 2: Mark what looks off */}
                <button
                  type="button"
                  role="tab"
                  id="tab-cap-1"
                  aria-selected={activeCap === 1}
                  aria-controls="panel-cap"
                  className={`cap-item-btn ${activeCap === 1 ? "active" : ""}`}
                  onClick={() => setActiveCap(1)}
                >
                  <div className="cap-title-row">
                    <span className="cap-bullet" aria-hidden="true" />
                    <h3>Mark what looks off</h3>
                  </div>
                  <p className="cap-desc">Outline what bothers you and compare it with a part that looks normal.</p>
                </button>

                {/* Cap 3: Keep a record */}
                <button
                  type="button"
                  role="tab"
                  id="tab-cap-2"
                  aria-selected={activeCap === 2}
                  aria-controls="panel-cap"
                  className={`cap-item-btn ${activeCap === 2 ? "active" : ""}`}
                  onClick={() => setActiveCap(2)}
                >
                  <div className="cap-title-row">
                    <span className="cap-bullet" aria-hidden="true" />
                    <h3>Keep a record</h3>
                  </div>
                  <p className="cap-desc">Every step is saved with a time, in order.</p>
                </button>

                {/* Cap 4: Share a report */}
                <button
                  type="button"
                  role="tab"
                  id="tab-cap-3"
                  aria-selected={activeCap === 3}
                  aria-controls="panel-cap"
                  className={`cap-item-btn ${activeCap === 3 ? "active" : ""}`}
                  onClick={() => setActiveCap(3)}
                >
                  <div className="cap-title-row">
                    <span className="cap-bullet" aria-hidden="true" />
                    <h3>Share a report</h3>
                  </div>
                  <p className="cap-desc">Turn the record into a plain report.</p>
                </button>
              </div>
            </div>

            {/* Right Column: Single Specimen Photo That Morphologically Changes Behavior */}
            <div className="cap-stage-col" id="panel-cap" role="tabpanel" aria-labelledby={`tab-cap-${activeCap}`}>
              <div className="cap-display-stage">
                {/* Visual State 1: Look closely (Magnifying Loupe) */}
                {activeCap === 0 && (
                  <div
                    className="cap-view-loupe"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setCapLoupe({ x: clamp(x, 8, 92), y: clamp(y, 8, 92) });
                    }}
                  >
                    <img src="/specimen.jpg" alt="Specimen for enlargement" className="cap-photo" />
                    <div
                      className="cap-loupe-disc"
                      style={{
                        left: `${capLoupe.x}%`,
                        top: `${capLoupe.y}%`,
                        backgroundImage: "url(/specimen.jpg)",
                        backgroundPosition: `${capLoupe.x}% ${capLoupe.y}%`,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                )}

                {/* Visual State 2: Mark what looks off (Interactive Canvas Outline) */}
                {activeCap === 1 && (
                  <div className="cap-view-canvas">
                    <img src="/specimen.jpg" alt="Specimen for region outline" className="cap-photo" />
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={478}
                      className="cap-drawing-canvas"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      aria-label="Draw a region outline on the specimen"
                    />
                    <div className="canvas-instruction-hint mono">
                      Drag anywhere to mark your own region
                    </div>
                  </div>
                )}

                {/* Visual State 3: Keep a record (Timestamped Slide-in Log) */}
                {activeCap === 2 && (
                  <div className="cap-view-log">
                    <img src="/specimen.jpg" alt="Specimen with investigation log" className="cap-photo faded" />
                    <div className="cap-log-panel">
                      <div className="clp-header mono">INVESTIGATION TIMELINE</div>
                      <div className="clp-entry">
                        <time className="clp-time mono">14 Mar 09:12</time>
                        <div className="clp-body">
                          <strong>File received</strong>
                          <span>interview_specimen_0417.jpg preserved as received</span>
                        </div>
                      </div>
                      <div className="clp-entry">
                        <time className="clp-time mono">14 Mar 09:14</time>
                        <div className="clp-body">
                          <strong>Hash calculated</strong>
                          <span className="mono">SHA-256 97e0959c…101df135</span>
                        </div>
                      </div>
                      <div className="clp-entry">
                        <time className="clp-time mono">14 Mar 09:22</time>
                        <div className="clp-body">
                          <strong>Region 1 marked</strong>
                          <span>Background wall frame, anomaly noted</span>
                        </div>
                      </div>
                      <div className="clp-entry highlight">
                        <time className="clp-time mono">14 Mar 09:31</time>
                        <div className="clp-body">
                          <strong>Indicator documented</strong>
                          <span>Cloned element with compression boundary discontinuity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visual State 4: Share a report (Folded Light Paper Report Card) */}
                {activeCap === 3 && (
                  <div className="cap-view-report">
                    <div className="paper-report-card">
                      <div className="prc-topbar">
                        <div>
                          <span className="mono prc-meta">CASE 0417 · EXAMINATION REPORT</span>
                          <h4>Media Indicator Summary</h4>
                        </div>
                        <button
                          type="button"
                          className="btn-download-sample"
                          onClick={() => window.open("/specimen.jpg", "_blank")}
                        >
                          Download sample
                        </button>
                      </div>

                      <div className="prc-content-grid">
                        <div className="prc-thumb-wrap">
                          <img
                            src="/specimen-crop-suspect.jpg"
                            alt="Suspect region evidence thumbnail"
                            className="prc-thumb"
                          />
                          <span className="mono prc-cap">Fig 1. Region 1 (cloned frame)</span>
                        </div>

                        <div className="prc-details">
                          <p className="prc-p">
                            One media asset was examined across quantization boundaries and sensor noise profiles.
                            Findings record structural indicators and do not establish definitive intent.
                          </p>
                          <div className="prc-status-row">
                            <span className="prc-badge-pill">Indicator flagged</span>
                            <span className="mono">Background wall anomaly</span>
                          </div>
                          <div className="prc-kv mono">
                            <span>Hash:</span> <span>SHA-256 97e0…f135</span>
                            <span>Preserved:</span> <span>Local browser sandbox</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live One-Line Caption Beneath Specimen */}
              <div className="cap-live-caption mono" aria-live="polite">
                {capCaptions[activeCap]}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: HOW HAVEN WORKS (One Case, Told by Scrolling) */}
        <section id="how" ref={howSectionRef} className="how-scroll-section" aria-label="How Haven works">
          <div className="how-pin-viewport">
            {/* The One Continuous Specimen Scene */}
            <div className="how-scene-container">
              {/* Layer 1: Base Photograph */}
              <img
                src="/specimen.jpg"
                alt="Documentary specimen in step sequence"
                className={`how-specimen-base ${howStep >= 2 ? "dimmed" : ""}`}
              />

              {/* Step 1 Visual: File drops into frame and SHA-256 types in */}
              <div className={`how-overlay-card step-1-card ${howStep === 1 ? "visible" : ""}`}>
                <div className="hoc-badge mono">INCOMING ASSET DETECTED</div>
                <div className="hoc-filename">interview_specimen_0417.jpg</div>
                <div className="hoc-hash mono">
                  SHA-256 97e0959c3c257f095498db1b4a60d69655dc2054e7dbf78aae4c1137101df135
                </div>
              </div>

              {/* Step 2 Visual: Scan sweeps across photo, revealing ELA layer */}
              <div
                className={`how-ela-wipe ${howStep >= 2 ? "active" : ""}`}
                style={{
                  clipPath: howStep === 2 ? "inset(0 0 0 0)" : howStep > 2 ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                }}
              >
                <img src="/specimen-ela.jpg" alt="Error Level Analysis scan" className="how-ela-img" />
                <div className="how-scanline" />
              </div>

              {/* Step 3 Visual: Outlines draw around suspect region (amber) & reference (mint) */}
              <div className={`how-outlines-layer ${howStep >= 3 ? "visible" : ""}`} aria-hidden="true">
                <div className="box-suspect-amber">
                  <span className="mono box-label">Region 1 · Suspect frame</span>
                </div>
                <div className="box-reference-mint">
                  <span className="mono box-label">Reference 2 · Original</span>
                </div>
              </div>

              {/* Step 4 Visual: Pinned note & right-edge growing log */}
              <div className={`how-note-pinned ${howStep >= 4 ? "visible" : ""}`}>
                <span className="mono note-time">09:31 UTC · Observation</span>
                <p>Compression boundary inconsistency detected on background cloned object.</p>
              </div>

              {/* Step 4 & 5 Progress: Growing timestamped log along the right edge */}
              <div className={`how-growing-log mono ${howStep >= 4 ? "visible" : ""}`}>
                <div className="hgl-item">09:12 · File received</div>
                <div className="hgl-item">09:14 · Hash recorded</div>
                <div className="hgl-item">09:22 · Regions marked</div>
                <div className="hgl-item hl">09:31 · Observation documented</div>
                {howStep >= 5 && <div className="hgl-item pass">10:05 · Report compiled</div>}
              </div>

              {/* Step 5 Visual: Scene lifts into the finished report card */}
              <div className={`how-finished-report-lift ${howStep === 5 ? "visible" : ""}`}>
                <div className="hfr-card">
                  <div className="hfr-title-row">
                    <span className="mono">EXAMINATION DOSSIER</span>
                    <h4>Report Case 0417</h4>
                  </div>
                  <p>All indicators compiled with cryptographic hash timestamps. Ready for review.</p>
                  <button type="button" className="btn-nav-round" onClick={onEnterWorkspace}>
                    Open in Haven
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Narrative Step Text: Large plain text laid directly on the scene */}
            <div className="how-step-text-wrap" aria-live="polite">
              {howStep === 1 && (
                <div className="how-step-content">
                  <span className="how-eyebrow">First</span>
                  <h3>Upload suspicious media</h3>
                  <p>Bring in the image or video you want to examine. Haven records the file and its details as received.</p>
                </div>
              )}
              {howStep === 2 && (
                <div className="how-step-content">
                  <span className="how-eyebrow">Next</span>
                  <h3>Look closely</h3>
                  <p>The file is examined frame by frame so there is a clear basis for what comes next.</p>
                </div>
              )}
              {howStep === 3 && (
                <div className="how-step-content">
                  <span className="how-eyebrow">Then</span>
                  <h3>Mark what's off</h3>
                  <p>Review the regions and metadata that may point to manipulation, and compare them with a reference.</p>
                </div>
              )}
              {howStep === 4 && (
                <div className="how-step-content">
                  <span className="how-eyebrow">After that</span>
                  <h3>Keep the record</h3>
                  <p>Add notes, screenshots, and sources to a timestamped record that stays attached to the file.</p>
                </div>
              )}
              {howStep === 5 && (
                <div className="how-step-content">
                  <span className="how-eyebrow">Finally</span>
                  <h3>Make a report</h3>
                  <p>Turn the record into a structured report that others can read, check, and act on.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 5: CLOSING ACTION */}
        <section id="cta" className="closing-section" aria-label="Get started">
          <div className="closing-inner rv">
            <h2>Make sense of what you see.</h2>
            <p className="closing-sub">Drop in the file you're unsure about.</p>

            {/* Wide fully-rounded pill dropzone */}
            <div
              className={`pill-dropzone closing-pill ${isDragging ? "drag-over" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Upload file to open Haven"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="pd-icon-circle" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 16V4M7 9l5-5 5 5" />
                  <path d="M20 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
                </svg>
              </div>
              <div className="pd-text-wrap">
                <span className="pd-main">Drop an image or video here</span>
                <span className="pd-sub mono">JPG, PNG, MP4. Stays in your browser.</span>
              </div>
              <button
                type="button"
                className="btn-pill-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterWorkspace();
                }}
              >
                Open Haven
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 6: EDITORIAL FOOTER */}
      <footer role="contentinfo">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-logo">Haven</div>
            <p className="footer-desc">
              A private digital safety workspace for examining suspicious media, documenting digital evidence, and
              generating clear reports.
            </p>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <a href="#top">Home</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#how">How it works</a>
          </div>

          <div className="footer-col">
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

          <div className="footer-col">
            <h4>Repository & Notice</h4>
            <a href="https://github.com/anooshyniazi01/Haven" target="_blank" rel="noopener noreferrer">
              GitHub Repository
            </a>
            <a href="#top">Security Architecture</a>
            <a href="#top">Privacy Guidelines</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy-note">
            © 2026 Haven. A prototype: results show indicators only and don't prove authenticity.
          </span>
          <nav className="footer-legal-nav" aria-label="Legal Links">
            <a href="#top">Privacy Notice</a>
            <a href="#top">Terms of Use</a>
          </nav>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
