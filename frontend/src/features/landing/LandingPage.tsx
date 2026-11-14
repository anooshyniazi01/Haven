import React, { useState, useEffect, useRef, useId } from "react";
import "../../styles/landing.css";

export interface LandingPageProps {
  onEnterWorkspace: () => void;
}

type ViewMode = "original" | "ela" | "noise";

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
  const [activeFrame, setActiveFrame] = useState<number>(4); // Frame 214
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // References for secondary static exhibit crops (ensuring zero black boxes anywhere)
  const cropCardRef = useRef<HTMLCanvasElement | null>(null);
  const reportCropRef = useRef<HTMLCanvasElement | null>(null);
  const stage3CropRef = useRef<HTMLCanvasElement | null>(null);

  // Typing effect for Stage 1 Hash in "How it works"
  const [typedHash, setTypedHash] = useState<string>("9f3a8b2c4e1d7065");
  const typingRef = useRef<HTMLDivElement | null>(null);

  // Quick leave handler for personal safety
  const handleLeaveQuickly = () => {
    window.location.replace("https://www.weather.com");
  };

  /**
   * Procedural forensic specimen renderer.
   * Renders a documentary architectural scene with fine geometry, window grids,
   * subtle texture, and a designated compression edge boundary.
   * In ELA mode: highlights compression variance around the boundary.
   * In Noise mode: visualizes high-frequency sensor noise matrix.
   */
  const renderFrameToContext = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameIndex: number,
    mode: ViewMode
  ) => {
    const shiftX = (frameIndex - 4) * 3; // subtle camera tracking across frames

    if (mode === "original") {
      // Documentary Architectural Specimen (Daylight, Muted Concrete, Glass Facade)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#D9E1DE");
      skyGrad.addColorStop(0.55, "#EBEFEA");
      skyGrad.addColorStop(1, "#ECECE6");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant building silhouette
      ctx.fillStyle = "#A8B4AE";
      ctx.fillRect(40 + shiftX * 0.4, 90, 140, height - 90);
      ctx.fillRect(200 + shiftX * 0.4, 120, 110, height - 120);

      // Primary architectural subject: brutalist facade
      ctx.fillStyle = "#707E78";
      ctx.fillRect(160 + shiftX, 70, 360, height - 70);

      // Window grid with reflections
      ctx.fillStyle = "#33413B";
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          const wx = 180 + c * 64 + shiftX;
          const wy = 90 + r * 54;
          ctx.fillRect(wx, wy, 44, 36);

          // Diagonal glass reflection
          ctx.fillStyle = "rgba(225, 235, 230, 0.35)";
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + 22, wy);
          ctx.lineTo(wx, wy + 28);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#33413B"; // reset for next window
        }
      }

      // Foreground horizontal sill & edge boundary
      ctx.fillStyle = "#4B5652";
      ctx.fillRect(140 + shiftX, 290, 420, 24);

      // The scrutinized boundary region (suspect compression boundary)
      ctx.fillStyle = "#5E6C66";
      ctx.beginPath();
      ctx.arc(310 + shiftX, 190, 38, 0, Math.PI * 2);
      ctx.fill();

      // Architectural seams and fine edge lines
      ctx.strokeStyle = "#25312C";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(160 + shiftX, 70);
      ctx.lineTo(160 + shiftX, height);
      ctx.moveTo(350 + shiftX, 70);
      ctx.lineTo(350 + shiftX, height);
      ctx.stroke();

      // Subtle simulated sensor noise for realistic documentary feel
      const idata = ctx.getImageData(0, 0, width, height);
      const data = idata.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 8;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(idata, 0, 0);

      // Amber indicator outline around scrutinized anomaly
      ctx.strokeStyle = "#C98A1B";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(270 + shiftX, 150, 80, 80);
      ctx.setLineDash([]);
    } else if (mode === "ela") {
      // Error-Level Analysis (Compression disparity map)
      ctx.fillStyle = "#161D1A";
      ctx.fillRect(0, 0, width, height);

      // Uniform low-level JPEG compression response
      const idata = ctx.createImageData(width, height);
      const d = idata.data;
      for (let i = 0; i < d.length; i += 4) {
        const base = Math.floor(Math.random() * 26) + 12;
        d[i] = base;
        d[i + 1] = base + 4;
        d[i + 2] = base + 2;
        d[i + 3] = 255;
      }
      ctx.putImageData(idata, 0, 0);

      // Edges with normal high-frequency error
      ctx.strokeStyle = "#6B7C75";
      ctx.lineWidth = 2;
      ctx.strokeRect(160 + shiftX, 70, 360, height - 70);

      // Highly elevated error level at the scrutinized boundary (Compression Discontinuity)
      const radGrad = ctx.createRadialGradient(
        310 + shiftX,
        190,
        4,
        310 + shiftX,
        190,
        48
      );
      radGrad.addColorStop(0, "rgba(235, 175, 60, 0.95)");
      radGrad.addColorStop(0.4, "rgba(200, 130, 30, 0.6)");
      radGrad.addColorStop(1, "rgba(20, 30, 25, 0)");
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(310 + shiftX, 190, 48, 0, Math.PI * 2);
      ctx.fill();

      // Indicator border
      ctx.strokeStyle = "#C98A1B";
      ctx.lineWidth = 2;
      ctx.strokeRect(270 + shiftX, 150, 80, 80);
    } else if (mode === "noise") {
      // Noise Analysis (Sensor PRNU noise distribution)
      ctx.fillStyle = "#0D1311";
      ctx.fillRect(0, 0, width, height);

      const idata = ctx.createImageData(width, height);
      const d = idata.data;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          // High-frequency Gaussian sensor pattern
          const v = Math.floor(128 + (Math.random() - 0.5) * 55);
          d[idx] = v;
          d[idx + 1] = v;
          d[idx + 2] = v;
          d[idx + 3] = 255;
        }
      }
      // Introduce localized smoothing/noise depletion in the scrutinized box
      const bx = 270 + shiftX;
      const by = 150;
      for (let y = by; y < by + 80; y++) {
        for (let x = bx; x < bx + 80; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = (y * width + x) * 4;
            // Less noise = unnatural smoothing / inpainting signature
            const v = Math.floor(128 + (Math.random() - 0.5) * 16);
            d[idx] = v;
            d[idx + 1] = v;
            d[idx + 2] = v;
          }
        }
      }
      ctx.putImageData(idata, 0, 0);

      ctx.strokeStyle = "#C98A1B";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, 80, 80);
    }
  };

  // Re-render main canvas whenever active frame or viewMode changes
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderFrameToContext(ctx, canvas.width, canvas.height, activeFrame, viewMode);
  }, [activeFrame, viewMode]);

  // Render thumbnail buttons and static crops once on mount
  useEffect(() => {
    // Render static crops for Section 2 and Section 4 to guarantee zero empty boxes
    const renderCrop = (
      canvas: HTMLCanvasElement | null,
      srcX: number,
      srcY: number,
      srcW: number,
      srcH: number
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw onto temporary master frame
      const off = document.createElement("canvas");
      off.width = 640;
      off.height = 360;
      const offCtx = off.getContext("2d");
      if (!offCtx) return;

      renderFrameToContext(offCtx, off.width, off.height, 4, "original");

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    };

    renderCrop(cropCardRef.current, 270, 150, 80, 80);
    renderCrop(reportCropRef.current, 260, 140, 100, 100);
    renderCrop(stage3CropRef.current, 270, 150, 80, 80);
  }, []);

  // Update follow-cursor loupe
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const canvas = mainCanvasRef.current;
    const loupe = loupeCanvasRef.current;
    if (!viewport || !canvas || !loupe) return;

    const rect = viewport.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (clientX < 0 || clientY < 0 || clientX > rect.width || clientY > rect.height) {
      setLoupePos((prev) => ({ ...prev, active: false }));
      return;
    }

    setLoupePos({ x: clientX, y: clientY, active: true });

    // Map screen coordinates to internal canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = clientX * scaleX;
    const canvasY = clientY * scaleY;

    // Magnify 3.5x
    const zoomSize = 40; // 40x40 pixel sample
    const sx = Math.max(0, Math.min(canvas.width - zoomSize, canvasX - zoomSize / 2));
    const sy = Math.max(0, Math.min(canvas.height - zoomSize, canvasY - zoomSize / 2));

    const lctx = loupe.getContext("2d");
    if (lctx) {
      lctx.imageSmoothingEnabled = false;
      lctx.clearRect(0, 0, loupe.width, loupe.height);
      lctx.drawImage(canvas, sx, sy, zoomSize, zoomSize, 0, 0, loupe.width, loupe.height);

      // Fine reticle
      lctx.strokeStyle = "rgba(201, 138, 27, 0.4)";
      lctx.lineWidth = 1;
      lctx.beginPath();
      lctx.moveTo(loupe.width / 2, 0);
      lctx.lineTo(loupe.width / 2, loupe.height);
      lctx.moveTo(0, loupe.height / 2);
      lctx.lineTo(loupe.width, loupe.height / 2);
      lctx.stroke();
    }
  };

  const handleMouseLeave = () => {
    setLoupePos((prev) => ({ ...prev, active: false }));
  };

  // Hash typing animation for Stage 1 in "How it works"
  useEffect(() => {
    const fullHash = "9f3a8b2c4e1d7065a83e0192d6e4b8a7";
    let idx = 16;
    const timer = setInterval(() => {
      idx++;
      if (idx <= fullHash.length) {
        setTypedHash(fullHash.slice(0, idx));
      } else {
        clearInterval(timer);
      }
    }, 180);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header className="haven-header" role="banner">
        <div className="header-inner">
          <a href="#top" className="brand-link" aria-label="Haven homepage">
            {/* Sturdy, high-contrast SVG logomark + wordmark that never drops the H crossbar */}
            <svg
              className="brand-mark"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
              {/* Solid, thick H with pronounced middle crossbar */}
              <path
                d="M8 8V20M20 8V20M8 14H20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              />
            </svg>
            <span className="brand-name">Haven</span>
          </a>

          <nav className="header-nav" aria-label="Primary navigation">
            <a href="#capabilities">Capabilities</a>
            <a href="#how">How it works</a>
            <a href="#demo">Interactive Exhibit</a>
            <a href="#limits">Limitations</a>
            <a href="#privacy">Privacy</a>
          </nav>

          <div className="header-actions">
            {/* Safety Exit Button */}
            <button
              type="button"
              className="btn btn-safety"
              onClick={handleLeaveQuickly}
              title="Quickly exit this website to a neutral page"
              aria-label="Leave quickly to a neutral page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Leave quickly</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onEnterWorkspace}
            >
              Examine a file
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* SECTION 1: HERO */}
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-layout">
            <div className="hero-copy">
              <h1 id="hero-title">Something doesn't look right. Start by looking closer.</h1>
              <p className="lead">
                Haven helps you examine a suspicious image or video, keep a clear record of what you find,
                and decide what to do next.
              </p>
              <div className="hero-ctas">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onEnterWorkspace}
                >
                  Examine a file
                </button>
                <a href="#how" className="btn btn-secondary">
                  See how it works
                </a>
              </div>
              <div className="hero-meta-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>
                  Evaluated within your private Haven instance. Your files are not shared with external commercial AI services.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quiet "Need help now?" Support Resources Strip */}
        <div className="support-strip" role="region" aria-label="Support Resources">
          <div className="support-strip-inner">
            <div className="support-strip-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>Need help now? Confidential support is available immediately:</span>
            </div>
            <p className="support-strip-text">
              If you or someone you know is facing online blackmail, non-consensual image distribution,
              or impersonation, these verified organizations can assist:
            </p>
            <div className="support-strip-links">
              <a
                href="https://takeitdown.ncmec.org"
                target="_blank"
                rel="noopener noreferrer"
                className="support-link"
              >
                Take It Down (NCMEC) ↗
              </a>
              <a
                href="https://stopncii.org"
                target="_blank"
                rel="noopener noreferrer"
                className="support-link"
              >
                StopNCII.org ↗
              </a>
              <a
                href="https://www.cybercivilrights.org"
                target="_blank"
                rel="noopener noreferrer"
                className="support-link"
              >
                Cyber Civil Rights Initiative ↗
              </a>
            </div>
          </div>
        </div>

        {/* SECTION 2: INTRO & GROUNDED PERSPECTIVE */}
        <section className="perspective-section" aria-labelledby="perspective-heading">
          <div className="perspective-header">
            <h2 id="perspective-heading">
              A convincing clip isn't proof of anything. Neither is a doubtful one.
            </h2>
            <p>
              When media is forwarded in a message or posted anonymously, it is easy to assume the worst.
              Haven provides a structured, calm way to inspect visual artifacts, note technical provenance,
              and build an objective record before taking action.
            </p>
          </div>

          <div className="perspective-grid">
            {/* Card A: Observed Media Frame */}
            <article className="p-card p-card-large">
              <div className="card-label">
                <span className="title">Observed Media Frame</span>
                <span className="tag mono">Exhibit A · specimen_0417.mp4</span>
              </div>
              <div className="p-card-preview">
                {/* Real canvas rendering source pixels */}
                <canvas
                  width={640}
                  height={400}
                  ref={(el) => {
                    if (el) {
                      const ctx = el.getContext("2d");
                      if (ctx) renderFrameToContext(ctx, 640, 400, 4, "original");
                    }
                  }}
                  aria-label="Observed video frame with an annotated compression boundary"
                />
              </div>
              <p className="caption">
                Frame 214 captured at 00:07.13. Dashed amber perimeter marks a localized compression boundary.
              </p>
            </article>

            {/* Card B: Boundary Analysis Crop (Actual Magnified Pixels) */}
            <article className="p-card p-card-detail">
              <div className="card-label">
                <span className="title">Boundary Analysis Crop</span>
                <span className="badge-review">Requires Review</span>
              </div>
              <div className="pixel-zoom-crop">
                {/* Real magnified pixels via canvas */}
                <canvas
                  ref={cropCardRef}
                  width={280}
                  height={280}
                  aria-label="Enlarged 4x pixel crop of the scrutinized compression boundary"
                />
                <span className="zoom-badge">4× Magnification</span>
              </div>
              <p className="caption">
                Enlarged crop demonstrates 8×8 block boundary disparity inconsistent with adjacent background blocks.
              </p>
            </article>

            {/* Card C: Transmission & Provenance Record */}
            <article className="p-card p-card-table">
              <div className="card-label">
                <span className="title">Technical Provenance Record</span>
                <span className="tag mono">Intake Ledger #0417</span>
              </div>
              <table className="provenance-table" aria-label="Media provenance indicators">
                <thead>
                  <tr>
                    <th scope="col">Inspection Vector</th>
                    <th scope="col">Observed Parameter</th>
                    <th scope="col">Technical Finding</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>File Integrity</td>
                    <td className="mono">SHA-256</td>
                    <td className="mono">9f3a8b2c4e1d7065a83e0192d6e4b8a7</td>
                    <td>
                      <span className="badge-verified">Recorded</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Compression Grid</td>
                    <td>8×8 DCT Matrices</td>
                    <td>Discontinuity detected along structural edge boundary</td>
                    <td>
                      <span className="badge-review">Disparity Flagged</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Container Metadata</td>
                    <td>MP4 / H.264 AVC</td>
                    <td>Re-encoded via social messaging gateway; original camera metadata stripped</td>
                    <td>
                      <span className="badge-review">Metadata Absent</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Audio Stream</td>
                    <td>AAC 44.1 kHz</td>
                    <td>No phase mismatch detected across temporal baseline</td>
                    <td>
                      <span className="badge-verified">Consistent</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>
          </div>
        </section>

        {/* SECTION 3: DARK INTERACTIVE EXHIBIT DEMO (Single Dark Rhythm Section) */}
        <section id="demo" className="dark-exhibit-section" aria-labelledby="demo-heading">
          <div className="exhibit-container">
            <div className="exhibit-header">
              <div>
                <h2 id="demo-heading">Interactive Media Inspection</h2>
                <p>
                  Explore real pixel-level forensic tools: hover with the magnifying loupe, switch analytical views,
                  and scrub between adjacent frames.
                </p>
              </div>
              <div className="demo-prototype-badge">
                <span>Prototype — sample examination data</span>
              </div>
            </div>

            <div className="exhibit-workspace">
              {/* Workspace Toolbar */}
              <div className="workspace-toolbar">
                <div className="view-mode-tabs" role="tablist" aria-label="Visual analysis modes">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "original"}
                    className={`tab-btn ${viewMode === "original" ? "active" : ""}`}
                    onClick={() => setViewMode("original")}
                  >
                    Original View
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "ela"}
                    className={`tab-btn ${viewMode === "ela" ? "active" : ""}`}
                    onClick={() => setViewMode("ela")}
                  >
                    Error-Level (ELA)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "noise"}
                    className={`tab-btn ${viewMode === "noise" ? "active" : ""}`}
                    onClick={() => setViewMode("noise")}
                  >
                    Noise Pattern
                  </button>
                </div>

                <div className="file-spec-meta">
                  <span>specimen_0417.mp4</span>
                  <span>·</span>
                  <span>Frame {210 + activeFrame} of 217</span>
                  <span>·</span>
                  <span>29.97 fps</span>
                </div>
              </div>

              {/* Main Interactive Canvas Viewport */}
              <div
                className="canvas-viewport-wrapper"
                ref={viewportRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                aria-label="Interactive specimen inspection area. Hover to magnify pixels."
              >
                <canvas
                  ref={mainCanvasRef}
                  width={640}
                  height={360}
                  className="main-exhibit-canvas"
                />

                {/* Follow-cursor magnifying loupe */}
                <div
                  className={`cursor-loupe ${loupePos.active ? "active" : ""}`}
                  style={{
                    left: `${loupePos.x}px`,
                    top: `${loupePos.y}px`,
                  }}
                  aria-hidden="true"
                >
                  <canvas ref={loupeCanvasRef} width={140} height={140} />
                  <div className="loupe-hud">3.5× Zoom</div>
                </div>
              </div>

              {/* Scrubbable Frame Strip */}
              <div className="frame-strip-deck">
                <div className="strip-label">
                  <span className="mono">Timeline Sequence (Frames 210–217)</span>
                  <span className="mono">Selected: Frame {210 + activeFrame}</span>
                </div>
                <div className="strip-thumbnails" role="radiogroup" aria-label="Video frame selector">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="radio"
                      aria-checked={activeFrame === idx}
                      className={`frame-thumb-btn ${activeFrame === idx ? "active" : ""}`}
                      onClick={() => setActiveFrame(idx)}
                      aria-label={`Select frame ${210 + idx}`}
                    >
                      <canvas
                        width={120}
                        height={75}
                        ref={(el) => {
                          if (el) {
                            const ctx = el.getContext("2d");
                            if (ctx) renderFrameToContext(ctx, 120, 75, idx, "original");
                          }
                        }}
                      />
                      <span className="frame-thumb-tag">F{210 + idx}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: CAPABILITIES */}
        <section id="capabilities" className="capabilities-section" aria-labelledby="capabilities-heading">
          <div className="capabilities-header">
            <h2 id="capabilities-heading">Capabilities built for clarity and care</h2>
            <p>
              Haven avoids opaque black-box assertions. Every capability is designed to surface objective indicators
              that you can verify, organize, and share.
            </p>
          </div>

          <div className="capabilities-grid">
            {/* Capability 1: Look closely */}
            <article className="capability-card">
              <div className="capability-header">
                <h3>Look closely</h3>
                <p>Frame-by-frame media examination to inspect compression edges, boundary anomalies, and visual artifacts.</p>
              </div>
              <div className="capability-visual">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                    Frame 214 · Spatial Magnification
                  </span>
                  <span className="badge-review">Anomaly Flagged</span>
                </div>
                <canvas
                  width={480}
                  height={180}
                  ref={(el) => {
                    if (el) {
                      const ctx = el.getContext("2d");
                      if (ctx) renderFrameToContext(ctx, 480, 180, 4, "original");
                    }
                  }}
                  style={{ width: "100%", height: "180px", borderRadius: "4px", display: "block" }}
                  aria-label="Frame inspection crop with boundary markers"
                />
              </div>
            </article>

            {/* Capability 2: Check where it came from */}
            <article className="capability-card">
              <div className="capability-header">
                <h3>Check where it came from</h3>
                <p>Document file provenance, platform re-encoding signatures, and transmission trails.</p>
              </div>
              <div className="capability-visual">
                <div className="mono" style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: "6px" }}>
                    <span>Container:</span>
                    <strong>ISO Base Media File Format (MP4)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: "6px" }}>
                    <span>Encoding Profile:</span>
                    <strong>libx264 Main@L4.0</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: "6px" }}>
                    <span>EXIF / GPS Payload:</span>
                    <strong style={{ color: "var(--amber)" }}>Stripped in transmission</strong>
                  </div>
                </div>
              </div>
            </article>

            {/* Capability 3: Keep a record */}
            <article className="capability-card">
              <div className="capability-header">
                <h3>Keep a record</h3>
                <p>Build a verifiable, timestamped investigation log with cryptographic SHA-256 hashes.</p>
              </div>
              <div className="capability-visual">
                <div className="mono" style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                    <span style={{ color: "var(--ink-tertiary)" }}>09:12:04 UTC</span>
                    <span>File imported: specimen_0417.mp4 (24.8 MB)</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                    <span style={{ color: "var(--ink-tertiary)" }}>09:12:06 UTC</span>
                    <span style={{ color: "var(--deep-green)", fontWeight: 700 }}>
                      SHA-256 computed: 9f3a8b2c4e1d7065...
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                    <span style={{ color: "var(--ink-tertiary)" }}>09:15:30 UTC</span>
                    <span>Frame 214 marked: Edge discontinuity annotated</span>
                  </div>
                </div>
              </div>
            </article>

            {/* Capability 4: Share a report */}
            <article className="capability-card">
              <div className="capability-header">
                <h3>Share a report</h3>
                <p>Export clear, readable evidence reports designed for platforms, counselors, or legal advisors.</p>
              </div>
              <div className="capability-visual">
                {/* Realistic Paper Evidence Report Dossier */}
                <div className="evidence-report-sheet" role="region" aria-label="Evidence Report Sample Sheet">
                  <div className="report-header-row">
                    <div>
                      <div className="report-title">Haven Evidence Report</div>
                      <div className="mono" style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                        Case Reference: #HAV-2026-0417
                      </div>
                    </div>
                    <div className="report-meta-tag">CONFIDENTIAL · AUDIT LOG</div>
                  </div>

                  <div className="report-body-grid">
                    <div className="report-section-block">
                      <h5>Findings Summary</h5>
                      <p>
                        One video stream examined. Frame 214 displays localized compression divergence along edge boundaries.
                        Findings describe observable indicators and require contextual corroboration.
                      </p>
                    </div>

                    <figure className="report-crop-figure">
                      <canvas ref={reportCropRef} width={180} height={90} />
                      <figcaption>Fig 1. Frame 214 crop</figcaption>
                    </figure>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* SECTION 5: HOW IT WORKS */}
        <section id="how" className="how-section" aria-labelledby="how-heading">
          <div className="how-header">
            <h2 id="how-heading">How Haven works</h2>
            <p>
              A five-stage methodical workflow that guides you from initial file intake to an actionable, documented report.
            </p>
          </div>

          <div className="how-steps-stack">
            {/* Step 1: Upload */}
            <div className="how-step-card">
              <div className="step-info">
                <span className="step-indicator">Stage 1 of 5</span>
                <h3>Upload suspicious media</h3>
                <p>
                  Bring in the file you received. Haven validates the container structure and records an immutable cryptographic hash.
                </p>
              </div>
              <div className="step-visual-box">
                <div className="hash-terminal" ref={typingRef}>
                  <div><strong>File:</strong> specimen_0417.mp4 (24.8 MB)</div>
                  <div>
                    <strong>SHA-256:</strong> {typedHash}
                    <span className="typing-cursor" />
                  </div>
                  <div style={{ color: "var(--deep-green)" }}>✓ Hash verified &amp; sealed in local vault</div>
                </div>
              </div>
            </div>

            {/* Step 2: Analyze */}
            <div className="how-step-card">
              <div className="step-info">
                <span className="step-indicator">Stage 2 of 5</span>
                <h3>Frame-by-frame analysis</h3>
                <p>
                  The media is decomposed into temporal frames so subtle splice transitions or boundary blurs can be observed.
                </p>
              </div>
              <div className="step-visual-box">
                <div style={{ width: "100%", display: "flex", gap: "8px", overflowX: "auto" }}>
                  {[0, 1, 2, 3].map((f) => (
                    <div key={f} style={{ flex: 1, minWidth: "70px", border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                      <canvas
                        width={100}
                        height={60}
                        ref={(el) => {
                          if (el) {
                            const ctx = el.getContext("2d");
                            if (ctx) renderFrameToContext(ctx, 100, 60, f + 2, "original");
                          }
                        }}
                        style={{ width: "100%", height: "60px", display: "block" }}
                      />
                      <div className="mono" style={{ fontSize: "10px", padding: "2px 4px", textAlign: "center", background: "#FFFFFF" }}>
                        F{212 + f}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Examine indicators */}
            <div className="how-step-card">
              <div className="step-info">
                <span className="step-indicator">Stage 3 of 5</span>
                <h3>Examine available indicators</h3>
                <p>
                  Inspect visual anomalies against established baselines, reviewing error levels and noise profiles.
                </p>
              </div>
              <div className="step-visual-box">
                <div style={{ display: "flex", gap: "16px", alignItems: "center", width: "100%" }}>
                  <canvas ref={stage3CropRef} width={120} height={120} style={{ border: "2px solid var(--amber)", borderRadius: "4px" }} />
                  <div className="mono" style={{ fontSize: "13px" }}>
                    <div style={{ color: "var(--amber)", fontWeight: 700 }}>Compression Boundary Disparity</div>
                    <div style={{ color: "var(--ink-secondary)", marginTop: "4px" }}>Delta: +24.6% vs reference frame baseline</div>
                    <div style={{ color: "var(--ink-tertiary)", marginTop: "4px" }}>Status: Observation recorded</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Document findings */}
            <div className="how-step-card">
              <div className="step-info">
                <span className="step-indicator">Stage 4 of 5</span>
                <h3>Document findings</h3>
                <p>
                  Attach notes, capture timestamps, and record context about where and when the file was delivered.
                </p>
              </div>
              <div className="step-visual-box">
                <div style={{ width: "100%", background: "#FFFFFF", padding: "14px", border: "1px solid var(--border)", borderRadius: "4px" }}>
                  <div className="mono" style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                    <strong>Note #1 (14 Mar 09:31 UTC):</strong>
                    <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--ink)" }}>
                      "Target file received via messaging link. Edge transition around structural perimeter differs across frames 212–219."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5: Generate report */}
            <div className="how-step-card">
              <div className="step-info">
                <span className="step-indicator">Stage 5 of 5</span>
                <h3>Generate an evidence report</h3>
                <p>
                  Assemble observations into a clear, structured PDF or printable dossier ready to hand to counselors or legal authorities.
                </p>
              </div>
              <div className="step-visual-box">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#FFFFFF", padding: "16px", border: "1px solid var(--border)", borderRadius: "4px", width: "100%" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--deep-green)" }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <div>
                    <strong style={{ fontSize: "14px" }}>Report-HAV-2026-0417.pdf</strong>
                    <div className="caption">Formatted with cryptographic signature and chain-of-custody metadata</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: WHAT HAVEN CAN'T DO (Trust Feature - Prominently Styled) */}
        <section id="limits" className="limits-section" aria-labelledby="limits-heading">
          <div className="limits-card">
            <div className="limits-header">
              <h2 id="limits-heading" style={{ fontSize: "28px" }}>What Haven can't do</h2>
              <p>
                Honest forensics means acknowledging technological limits. Haven describes observable indicators;
                it does not replace human judgment or guarantee absolute certainty.
              </p>
            </div>

            <div className="limits-grid">
              <div className="limit-item">
                <h4>It does not prove absolute authenticity</h4>
                <p>
                  No automated detector can guarantee that an image is 100% genuine or synthetic. Subtle edits
                  or clean generative models may show no obvious visual flaws.
                </p>
              </div>

              <div className="limit-item">
                <h4>Messaging compression mimics manipulation</h4>
                <p>
                  When files are sent through platforms like WhatsApp, Telegram, or Discord, aggressive recompression
                  can create edge artifacts that resemble tampering.
                </p>
              </div>

              <div className="limit-item">
                <h4>It cannot establish malicious intent</h4>
                <p>
                  Visual indicators cannot tell you who created a file, where they obtained it, or whether blackmail
                  was intended. Context and corroborated communication records remain critical.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: PRIVACY & TRUST */}
        <section id="privacy" className="privacy-section" aria-labelledby="privacy-heading">
          <div className="privacy-grid">
            <div className="privacy-col">
              <h4>Local-First Architecture</h4>
              <p>
                Analysis runs via local ONNX models on your Haven instance. Uploaded media is processed directly
                by the server host, not forwarded to external third-party commercial AI models.
              </p>
            </div>

            <div className="privacy-col">
              <h4>You Control Your Evidence</h4>
              <p>
                Files and hash ledgers reside in your instance's protected database and local filesystem.
                You can permanently purge records at any time with complete data eradication.
              </p>
            </div>

            <div className="privacy-col">
              <h4>Zero Behavioral Telemetry</h4>
              <p>
                Haven includes zero third-party advertising trackers, external analytics scripts, or behavioral tracking beacons.
                Your safety and discretion are non-negotiable.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 8: FIRST-PERSON BUILDER NOTE */}
        <section id="about" className="builder-section" aria-labelledby="builder-heading">
          <div className="builder-note">
            <h3 id="builder-heading">Why I built Haven</h3>
            <blockquote>
              "When someone receives an intimidating clip or suspect image, the instinctive reaction is panic.
              Most forensics software today is either opaque enterprise defense tools or sensational clickbait AI detectors
              that offer false certainty. I built Haven to provide a steady, private environment where people can look closely,
              record the facts objectively, and regain their footing."
            </blockquote>
            <p className="builder-author">
              — Built by Anosh, independent software designer &amp; forensics engineer
            </p>
          </div>
        </section>

        {/* SECTION 9: FINAL CTA */}
        <section className="final-cta-section" aria-labelledby="final-cta-heading">
          <div className="final-cta-card">
            <h2 id="final-cta-heading">Got something you're unsure about? Bring it here.</h2>
            <p>
              Take a quiet, structured look at the media, preserve the facts, and understand what the evidence actually shows.
            </p>
            <div className="final-cta-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onEnterWorkspace}
              >
                Examine a file
              </button>
              <a href="#how" className="btn btn-secondary">
                See how it works
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="haven-footer" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>Product</h4>
              <ul className="footer-links">
                <li><a href="#top">Home</a></li>
                <li><a href="#capabilities">Capabilities</a></li>
                <li><a href="#how">How it works</a></li>
                <li><a href="#demo">Interactive Exhibit</a></li>
                <li><a href="#limits">Forensic Limitations</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Get help</h4>
              <ul className="footer-links">
                <li>
                  <a href="https://takeitdown.ncmec.org" target="_blank" rel="noopener noreferrer">
                    Take It Down (NCMEC) ↗
                  </a>
                </li>
                <li>
                  <a href="https://stopncii.org" target="_blank" rel="noopener noreferrer">
                    StopNCII.org ↗
                  </a>
                </li>
                <li>
                  <a href="https://www.cybercivilrights.org" target="_blank" rel="noopener noreferrer">
                    Cyber Civil Rights Initiative ↗
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Open source</h4>
              <ul className="footer-links">
                <li>
                  <a href="https://github.com/anooshyniazi01/Haven" target="_blank" rel="noopener noreferrer">
                    GitHub Repository ↗
                  </a>
                </li>
                <li><a href="#privacy">Privacy &amp; Data Model</a></li>
                <li><a href="#limits">Forensic Limitations</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Haven.</span>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy Notice</a>
              <a href="#limits">Ethical Forensics Policy</a>
              <a href="https://github.com/anooshyniazi01/Haven" target="_blank" rel="noopener noreferrer">
                Source Code
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
