import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingPage } from "../../src/features/landing/LandingPage";

describe("LandingPage Production Suite (Phase 1)", () => {
  it("renders Section 1: Hero with Fraunces wordmark, tagline, and actions", () => {
    const handleExplore = vi.fn();
    render(<LandingPage onEnterWorkspace={handleExplore} />);

    // Wordmark
    const wordmarks = screen.getAllByText("Haven");
    expect(wordmarks.length).toBeGreaterThanOrEqual(1);

    // Tagline & description
    expect(screen.getByText("Your digital safety workspace.")).toBeInTheDocument();
    expect(
      screen.getByText(/Haven brings media examination, evidence documentation, and forensic investigation into one private workspace/i)
    ).toBeInTheDocument();

    // CTAs
    const exploreButtons = screen.getAllByRole("button", { name: /Explore Haven/i });
    expect(exploreButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "How Haven Works" })).toBeInTheDocument();

    // Forensic Exhibit
    expect(screen.getByText(/EXHIBIT \/\/ MEDIA_INSPECTION_0491/i)).toBeInTheDocument();
    expect(screen.getByText("SHA-256 VERIFIED")).toBeInTheDocument();
  });

  it("renders Section 2: Introduction with verified editorial copy", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Not everything online is what it appears to be." })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Haven brings media examination, evidence documentation, and investigation into one workspace.")
    ).toBeInTheDocument();
    expect(screen.getByText(/UNTRUSTED INGESTION/i)).toBeInTheDocument();
    expect(screen.getByText(/OBJECTIVE VERIFICATION/i)).toBeInTheDocument();
  });

  it("renders Section 3: All 4 distinct Capabilities panels", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 3, name: "Media Analysis" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Authenticity Investigation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Evidence Documentation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Evidence Reports" })).toBeInTheDocument();

    // Specific capability exhibits
    expect(screen.getByText(/DUAL-PANE ELA COMPARISON/i)).toBeInTheDocument();
    expect(screen.getByText(/EVIDENCE VAULT LEDGER/i)).toBeInTheDocument();
    expect(screen.getByText(/EXPORTABLE DOSSIER PREVIEW/i)).toBeInTheDocument();
  });

  it("renders Section 4: How Haven Works with all 5 sequential stages", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "How Haven Works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Upload suspicious media" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Analyze the media" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Examine available indicators" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Document findings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Generate an evidence report" })).toBeInTheDocument();
  });

  it("renders Section 5: Final CTA with direct action to explore", () => {
    const handleExplore = vi.fn();
    render(<LandingPage onEnterWorkspace={handleExplore} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Make sense of what you see." })
    ).toBeInTheDocument();

    const ctaBtns = screen.getAllByRole("button", { name: /Explore Haven/i });
    fireEvent.click(ctaBtns[ctaBtns.length - 1]);
    expect(handleExplore).toHaveBeenCalled();
  });

  it("renders Section 6: Editorial Footer with navigation and verified resource links", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("Take It Down (NCMEC)")).toBeInTheDocument();
    expect(screen.getByText("StopNCII.org")).toBeInTheDocument();
    expect(screen.getByText("GitHub Repository")).toBeInTheDocument();
    expect(screen.getByText(/© 2026 Haven. All rights reserved./i)).toBeInTheDocument();
  });
});
