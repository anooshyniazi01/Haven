import React, { useEffect } from "react";
import "../../styles/landing.css";

export interface LandingPageProps {
  onEnterWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
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

    // Body background dark
    document.body.style.backgroundColor = "#080B09";
    document.body.style.color = "#ffffff";

    /* Waveform + filmstrip generated procedurally */
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

    const film = $("#film");
    if (film && film.children.length === 0) {
      for (let i = 0; i < 8; i++) {
        film.insertAdjacentHTML(
          "beforeend",
          `<svg viewBox="${130 + i * 1.5} 70 140 105"${
            i === 4 ? ' class="sel"' : ""
          } aria-hidden="true"><use href="#scene"/></svg>`
        );
      }
    }

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
      pin();
    }

    /* Pinned horizontal capabilities (desktop only) */
    const sec = $("#capabilities");
    const track = $("#track");
    const cnt = $("#cnt");
    const mq = window.matchMedia("(min-width: 901px)");
    let total = 0;

    function size() {
      if (!sec || !track) return;
      if (!mq.matches) {
        sec.style.height = "";
        track.style.transform = "";
        return;
      }
      total = Math.max(0, track.scrollWidth - window.innerWidth);
      sec.style.height = total + window.innerHeight + "px";
    }

    function pin() {
      if (!mq.matches || !sec || !track || !cnt) return;
      const t = clamp((window.scrollY - sec.offsetTop) / (total || 1));
      track.style.transform = `translate3d(${-t * total}px,0,0)`;
      cnt.textContent = String(Math.min(4, Math.round(t * 3) + 1));
    }

    const handleTrackScroll = () => {
      if (!mq.matches && track && cnt) {
        cnt.textContent = String(Math.min(4, Math.round(track.scrollLeft / (track.scrollWidth - track.clientWidth || 1) * 3) + 1));
      }
    };
    if (track) {
      track.addEventListener("scroll", handleTrackScroll, { passive: true });
    }

    /* Reveals via IntersectionObserver */
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    $$(".rv").forEach((el) => io.observe(el));

    /* How-it-works: stage builds up as steps scroll */
    const stage = $("#stage");
    const steps = $$(".step");
    const layers = $$(".l");
    const rail = $$("#rail i");
    let cur = 0;

    function setStep(n: number) {
      if (n === cur || !stage) return;
      cur = n;
      stage.className = "stage s" + n + (n === 2 ? " scan" : "");
      layers.forEach((l) => {
        const f = +(l.dataset.from || 1);
        const to = +(l.dataset.to || 9);
        l.classList.toggle("on", n >= f && n <= to);
      });
      steps.forEach((s) => s.classList.toggle("on", +(s.dataset.n || 0) === n));
      rail.forEach((r, i) => r.classList.toggle("on", i < n));
    }

    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStep(+((entry.target as HTMLElement).dataset.n || 1));
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    steps.forEach((s) => so.observe(s));
    if (steps[0]) {
      steps[0].classList.add("on");
      cur = 1;
    }

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
      size();
      update();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", all);
    mq.addEventListener("change", all);

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
      mq.removeEventListener("change", all);
      if (track) {
        track.removeEventListener("scroll", handleTrackScroll);
      }
      io.disconnect();
      so.disconnect();
      root.classList.remove("go");
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
    };
  }, []);

  return (
    <>
      {/* SVG Global Definitions: Lighting, Film Grain, Vignette & Forensic Workstation Scene */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="b4">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="b1">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
          <filter id="gr" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} seed={4} />
            <feColorMatrix values="0 0 0 0 .75 0 0 0 0 .8 0 0 0 0 .75 .7 0 0 0 -.18" />
          </filter>
          <linearGradient id="wl" x1="0" x2="1">
            <stop offset="0" stopColor="#1a2420" />
            <stop offset="1" stopColor="#0a0e0b" />
          </linearGradient>
          <radialGradient id="scrglow" cx=".5" cy=".45" r=".5">
            <stop offset="0" stopColor="#39D98A" stopOpacity=".12" />
            <stop offset="1" stopColor="#39D98A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vg" cx=".5" cy=".5" r=".75">
            <stop offset=".55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".65" />
          </radialGradient>

          {/* Forensic workstation scene — no human face */}
          <symbol id="scene" viewBox="0 0 400 300">
            {/* Room background */}
            <rect width="400" height="300" fill="url(#wl)" />
            {/* Desk surface */}
            <rect x="0" y="232" width="400" height="68" fill="#0d1310" />
            <rect x="0" y="230" width="400" height="4" fill="#182018" />
            {/* Monitor stand */}
            <rect x="186" y="220" width="28" height="14" rx="2" fill="#141a15" />
            <rect x="168" y="232" width="64" height="5" rx="2" fill="#111611" />
            {/* Monitor bezel */}
            <rect x="58" y="38" width="284" height="188" rx="6" fill="#0e1410" />
            {/* Screen */}
            <rect x="66" y="46" width="268" height="172" rx="3" fill="#060d08" />
            {/* Screen ambient glow */}
            <rect x="66" y="46" width="268" height="172" rx="3" fill="url(#scrglow)" />
            {/* Title bar */}
            <rect x="66" y="46" width="268" height="18" rx="3" fill="#101810" />
            {/* Traffic lights */}
            <circle cx="80" cy="55" r="3.5" fill="#2a3a2a" />
            <circle cx="91" cy="55" r="3.5" fill="#2a3a2a" />
            <circle cx="102" cy="55" r="3.5" fill="#39D98A" opacity=".7" />
            {/* Title bar text sim */}
            <rect x="150" y="52" width="80" height="5" rx="2" fill="#202c23" />

            {/* Left column: Terminal telemetry logs */}
            <rect x="76" y="74" width="94" height="3.5" rx="1" fill="#39D98A" opacity=".75" />
            <rect x="76" y="83" width="70" height="3.5" rx="1" fill="#A5AAA6" opacity=".4" />
            <rect x="76" y="92" width="86" height="3.5" rx="1" fill="#39D98A" opacity=".55" />
            <rect x="76" y="101" width="55" height="3.5" rx="1" fill="#A5AAA6" opacity=".35" />
            <rect x="76" y="110" width="90" height="3.5" rx="1" fill="#39D98A" opacity=".6" />
            <rect x="76" y="119" width="65" height="3.5" rx="1" fill="#A5AAA6" opacity=".3" />
            <rect x="76" y="128" width="82" height="3.5" rx="1" fill="#39D98A" opacity=".5" />
            <rect x="76" y="137" width="50" height="3.5" rx="1" fill="#A5AAA6" opacity=".25" />
            <rect x="76" y="146" width="78" height="3.5" rx="1" fill="#39D98A" opacity=".65" />

            {/* Right column: Video Frame Inspection Viewport */}
            <rect x="180" y="72" width="144" height="80" rx="2" fill="#09120d" stroke="#1c2c20" strokeWidth="0.8" />
            {/* Inspection coordinate grid */}
            <path d="M180 92h144M180 112h144M180 132h144M216 72v80M252 72v80M288 72v80" stroke="#132217" strokeWidth="0.6" strokeDasharray="2 2" />
            
            {/* Subject contour wireframe in inspection view */}
            <path d="M236 80c14 0 25 9 25 21 0 7-3 13-9 16v7c-5 9-14 14-23 14-11 0-18-7-20-16l12-5c3 5 7 7 12 7 6 0 11-4 13-10v-3c-2 0-3-1-5-2-7-3-11-10-11-17 0-12 11-21 25-21z" fill="#131e17" />
            {/* Facial profile boundary curve */}
            <path d="M248 85c5 3 9 9 9 16 0 4-2 9-5 12l-4 5c-3 4-6 7-11 8" fill="none" stroke="#253d2e" strokeWidth="1.2" />
            {/* Marked artifact boundary (Jaw contour halo anomaly) */}
            <path d="M237 126c4-1 8-4 11-7l3-6" fill="none" stroke="#D9A441" strokeWidth="1.8" strokeDasharray="2 2" />
            <circle cx="245" cy="121" r="5" fill="#39D98A" fillOpacity="0.2" stroke="#39D98A" strokeWidth="0.8" />

            {/* Bottom: Frame thumbnail strip */}
            <rect x="76" y="160" width="248" height="42" rx="2" fill="#080e09" />
            <rect x="78" y="162" width="28" height="38" rx="1" fill="#141c15" />
            <rect x="109" y="162" width="28" height="38" rx="1" fill="#141c15" />
            <rect x="140" y="162" width="28" height="38" rx="1" fill="#141c15" />
            <rect x="171" y="162" width="28" height="38" rx="1" fill="#141c15" />
            {/* Active frame 214 */}
            <rect x="202" y="160" width="30" height="42" rx="1" fill="#1b2e23" stroke="#39D98A" strokeWidth="1.5" />
            <rect x="235" y="162" width="28" height="38" rx="1" fill="#141c15" />
            <rect x="266" y="162" width="28" height="38" rx="1" fill="#141c15" />
            <rect x="297" y="162" width="25" height="38" rx="1" fill="#141c15" />

            {/* Film grain + vignette */}
            <rect width="400" height="300" filter="url(#gr)" opacity=".35" />
            <rect width="400" height="300" fill="url(#vg)" />
          </symbol>
        </defs>
      </svg>

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

      {/* Continuous Scroll-Linked Animated Wordmark */}
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
              <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sample video frame with two marked regions">
                <use href="#scene" />
                <path className="mk" d="M180 72h14M180 72v14M324 72h-14M324 72v14M180 152h14M180 152v-14M324 152h-14M324 152v-14" />
                <rect className="mk mkd" x="228" y="106" width="36" height="26" />
                <text x="328" y="74">1</text>
                <text x="268" y="112">2</text>
              </svg>
              <span className="tc mono">00:07.13 · Frame 214</span>
              <span className="tc r mono">Sample · illustrative</span>
              <div className="mag">
                <svg viewBox="228 106 36 26" role="img" aria-label="Enlarged crop of region 2">
                  <use href="#scene" />
                  <rect className="mk mkd" x="230" y="108" width="32" height="22" />
                </svg>
                <div className="cap mono">2 · Jaw contour · enlarged</div>
              </div>
            </div>
            <div className="below">
              <svg className="wave" data-wave="96" viewBox="0 0 400 46" preserveAspectRatio="none" role="img" aria-label="Audio waveform of the sample file" />
              <div className="cap mono">interview_clip_0417.mp4 · H.264 · 1920×1080 · 29.97 fps</div>
              <div className="cap mono">SHA-256 9f3a…c71e · prototype content, no analysis performed</div>
            </div>
          </figure>
        </section>

        {/* SECTION 2: INTRO */}
        <section className="intro" aria-label="Introduction">
          <h2 className="rv">Some things are hard to verify by eye.</h2>
          <div className="copy rv">
            <p>
              Edited media can look convincing. Haven examines indicators and builds a record of what it observed — not a verdict.
            </p>
            <p className="cap">Illustrative exhibits shown. No real analysis is performed in this prototype.</p>
          </div>
          <figure className="ex a rv">
            <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sample video frame, wide view">
              <use href="#scene" />
            </svg>
            <figcaption className="cap mono">Exhibit A · video received by message, 14 Mar</figcaption>
          </figure>
          <figure className="ex b rv">
            <svg viewBox="210 95 65 55" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Enlarged crop of region of interest">
              <use href="#scene" />
              <rect className="mk mkd" x="228" y="106" width="36" height="26" />
            </svg>
            <figcaption className="cap mono">Exhibit A · frame 214, enlarged crop</figcaption>
          </figure>
          <figure className="ex c rv">
            <div className="rows mono">
              <div>
                <span className="tm">Sender</span>
                <span>Unknown</span>
                <span className="st w">Unverified</span>
              </div>
              <div>
                <span className="tm">Platform</span>
                <span>Messaging app</span>
                <span />
              </div>
              <div>
                <span className="tm">Re-encoded</span>
                <span>Yes</span>
                <span />
              </div>
              <div>
                <span className="tm">Original</span>
                <span>Not located</span>
                <span className="st w">Open</span>
              </div>
            </div>
            <figcaption className="cap mono">Exhibit B · provenance notes (illustrative)</figcaption>
          </figure>
        </section>

        {/* SECTION 3: CAPABILITIES */}
        <section id="capabilities" aria-label="Capabilities">
          <div className="pin">
            <div className="chead">
              <h2 style={{ color: "var(--tx)" }}>Capabilities</h2>
              <span className="mono">
                <span id="cnt">1</span> / 4
              </span>
            </div>
            <div className="track" id="track">
              {/* Panel 1 */}
              <article className="panel p1">
                <div className="t">
                  <span className="mono n">01</span>
                  <h3>Frame by frame</h3>
                  <p>Step through video one frame at a time. Mark anything that looks off.</p>
                </div>
                <div className="v">
                  <div className="m1">
                    <svg className="main" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Large sample frame with a selected region">
                      <use href="#scene" />
                      <path className="mk" d="M180 72h14M180 72v14M324 72h-14M324 72v14M180 152h14M180 152v-14M324 152h-14M324 152v-14" />
                      <rect className="mk mkd" x="228" y="106" width="36" height="26" />
                      <text x="268" y="112">A</text>
                    </svg>
                    <div className="mag2">
                      <svg viewBox="228 106 36 26" role="img" aria-label="Enlarged crop of region A">
                        <use href="#scene" />
                        <rect className="mk mkd" x="230" y="108" width="32" height="22" />
                      </svg>
                      <div className="cap mono">A · 6× · frame 214</div>
                    </div>
                    <div className="film" id="film" />
                    <div className="ruler mono">
                      <span>00:07.00</span>
                      <span>Frame 214 selected</span>
                      <span>00:07.27</span>
                    </div>
                  </div>
                </div>
              </article>

              {/* Panel 2 */}
              <article className="panel p2">
                <div className="v">
                  <div className="cmp">
                    <div>
                      <svg viewBox="176 68 152 90" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Reference frame">
                        <use href="#scene" />
                      </svg>
                      <span className="lb mono">Reference</span>
                      <div className="dt">
                        <svg viewBox="228 106 36 26">
                          <use href="#scene" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <svg viewBox="176 68 152 90" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Submitted frame with an area marked for review">
                        <use href="#scene" />
                        <rect className="mk wn mkd" x="228" y="106" width="36" height="26" />
                      </svg>
                      <span className="lb mono">Submitted file</span>
                      <div className="dt">
                        <svg viewBox="228 106 36 26">
                          <use href="#scene" />
                          <rect className="mk wn mkd" x="230" y="108" width="32" height="22" />
                        </svg>
                      </div>
                    </div>
                    <span className="dv" />
                    <span className="hd" aria-hidden="true">
                      ‹›
                    </span>
                  </div>
                </div>
                <div className="band">
                  <div className="t">
                    <span className="mono n">02</span>
                    <h3>Side by side</h3>
                    <p>Compare a submitted file against a reference. Mark where they differ.</p>
                  </div>
                  <div className="rows mono">
                    <div>
                      <span className="tm">Jaw edge</span>
                      <span>Halo not present in reference</span>
                      <span className="st w">Requires review</span>
                    </div>
                    <div>
                      <span className="tm">Compression</span>
                      <span>Differs between files</span>
                      <span className="st w">Inconsistent indicator</span>
                    </div>
                    <div>
                      <span className="tm">Encoder</span>
                      <span>Matches reference</span>
                      <span className="st">Consistent with reference</span>
                    </div>
                  </div>
                </div>
              </article>

              {/* Panel 3 */}
              <article className="panel p3">
                <div className="t">
                  <div className="bn" aria-hidden="true">
                    03
                  </div>
                  <span className="mono n">03</span>
                  <h3>An investigation log</h3>
                  <p>Every step is recorded automatically. Add your own notes when Haven can't see the full picture.</p>
                  <span className="cap mono">Illustrative record</span>
                </div>
                <div className="v">
                  <div className="evlog mono">
                    <div className="eventry">
                      <time className="evtime">14 Mar 09:12</time>
                      <div className="evtext">
                        <strong>File received</strong>
                        <span>interview_clip_0417.mp4 preserved as received</span>
                      </div>
                    </div>
                    <div className="eventry">
                      <time className="evtime">14 Mar 09:14</time>
                      <div className="evtext">
                        <strong>Hash recorded</strong>
                        <span>SHA-256 9f3a…c71e</span>
                      </div>
                    </div>
                    <div className="eventry">
                      <time className="evtime">14 Mar 09:22</time>
                      <div className="evtext">
                        <strong>Frame captured</strong>
                        <span>Frame 214, jaw edge</span>
                      </div>
                    </div>
                    <div className="eventry w">
                      <time className="evtime">14 Mar 09:31</time>
                      <div className="evtext">
                        <strong>Observation documented</strong>
                        <span>Edge differs across frames 212–219. Requires review.</span>
                      </div>
                    </div>
                    <div className="eventry">
                      <time className="evtime">14 Mar 09:47</time>
                      <div className="evtext">
                        <strong>Source information added</strong>
                        <span>No earlier upload located</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              {/* Panel 4 */}
              <article className="panel p4">
                <div className="t">
                  <span className="mono n">04</span>
                  <h3>A readable report</h3>
                  <p>Export a clear summary. Structured enough to send to a platform, lawyer, or support org.</p>
                </div>
                <div className="v">
                  <div className="doc">
                    <div className="hd2">
                      <div>
                        <span className="mono">Digital media examination</span>
                        <h4>Evidence report</h4>
                      </div>
                      <span className="mono">Case 0417 · Sample</span>
                    </div>
                    <div className="col">
                      <section>
                        <h5>Examination summary</h5>
                        <p>
                          One video file was received and examined frame by frame. Two regions were marked for
                          review. Findings describe indicators only and do not establish authenticity.
                        </p>
                      </section>
                      <figure>
                        <svg viewBox="200 85 100 65" role="img" aria-label="Report figure">
                          <use href="#scene" />
                          <rect className="mk mkd" x="228" y="106" width="36" height="26" />
                        </svg>
                        <figcaption className="mono">Fig. 1 · Frame 214, jaw edge, region marked for review</figcaption>
                      </figure>
                    </div>
                    <div className="col">
                      <section>
                        <h5>Findings and observations</h5>
                        <ol>
                          <li>Jaw edge: requires review</li>
                          <li>Compression: inconsistent indicator</li>
                          <li>Encoder: consistent with reference</li>
                        </ol>
                      </section>
                      <section>
                        <h5>File information</h5>
                        <div className="kv mono">
                          <span>File</span>
                          <span>interview_clip_0417.mp4</span>
                          <span>Received</span>
                          <span>2026-03-14 09:12 UTC</span>
                          <span>Format</span>
                          <span>MP4 · H.264</span>
                          <span>SHA-256</span>
                          <span>9f3a…c71e</span>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 4: HOW HAVEN WORKS */}
        <section id="how" className="how" aria-label="How Haven works">
          <h2 className="rv">How Haven works</h2>
          <div className="stage-w">
            <div className="stage s1" id="stage" role="img" aria-label="Illustration of an investigation record building up stage by stage">
              <svg className="scn" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                <use href="#scene" />
              </svg>
              <div className="chip mono l on" data-from="1" data-to="1">
                interview_clip_0417.mp4 · queued
              </div>
              <div className="scanl" />
              <svg className="ov l" data-from="3" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                <path className="mk" d="M150 78h16M150 78v18M250 78h-16M250 78v18" />
                <rect className="mk mkd" x="154" y="158" width="92" height="34" />
                <text x="150" y="70">1</text>
                <text x="250" y="204">2</text>
              </svg>
              <div className="note mono l" data-from="4" data-to="4">
                <span>Note · 09:31</span>
                Jaw edge differs between frames 212–219.
              </div>
              <div className="log mono">
                <div className="l on" data-from="1">
                  09:12 · File received
                </div>
                <div className="l" data-from="2">
                  09:14 · Hash recorded
                </div>
                <div className="l" data-from="3">
                  09:22 · Regions marked
                </div>
                <div className="l" data-from="4">
                  09:31 · Observation added
                </div>
                <div className="l" data-from="5">
                  10:05 · Report compiled
                </div>
              </div>
              <div className="sheet mono l" data-from="5">
                <b>Evidence report</b>
                <span style={{ color: "#6a716c", fontSize: "9px" }}>Case 0417 · Sample</span>
                <i style={{ width: "100%" }} />
                <i style={{ width: "90%" }} />
                <i style={{ width: "96%" }} />
                <svg viewBox="150 100 100 70" style={{ width: "100%" }}>
                  <use href="#scene" />
                </svg>
                <i style={{ width: "92%" }} />
                <i style={{ width: "70%" }} />
              </div>
            </div>
          </div>
          <div className="steps">
            <div className="step" data-n="1">
              <h3>Drop the file</h3>
              <p>Haven accepts images and videos. It records the hash immediately.</p>
            </div>
            <div className="step" data-n="2">
              <h3>Examine frame by frame</h3>
              <p>The file opens one frame at a time. Each region is checked.</p>
            </div>
            <div className="step" data-n="3">
              <h3>Review what it found</h3>
              <p>Haven shows you the indicators. You decide what matters.</p>
            </div>
            <div className="step" data-n="4">
              <h3>Add what you know</h3>
              <p>Write in context Haven can't see — when you got it, from whom, what was said.</p>
            </div>
            <div className="step" data-n="5">
              <h3>Export the record</h3>
              <p>One structured document with everything in one place.</p>
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
