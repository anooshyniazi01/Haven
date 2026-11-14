import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingPage } from "../../src/features/landing/LandingPage";

describe("LandingPage Production Suite", () => {
  it("renders Section 1: Hero with wordmark, tagline, and actions", () => {
    const handleExplore = vi.fn();
    render(<LandingPage onEnterWorkspace={handleExplore} />);

    // Wordmark
    const wordmarks = screen.getAllByText("Haven");
    expect(wordmarks.length).toBeGreaterThanOrEqual(1);

    // Tagline & description
    expect(screen.getByText("When something looks off, look closer.")).toBeInTheDocument();
    expect(
      screen.getByText(/Upload an image or video\. Haven checks what it can/i)
    ).toBeInTheDocument();

    // CTAs
    const openButtons = screen.getAllByRole("button", { name: /Open Haven/i });
    expect(openButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: /See how it works/i })).toBeInTheDocument();

    // Forensic Exhibit
    expect(screen.getByText(/00:07.13 · Frame 214/i)).toBeInTheDocument();
    expect(screen.getByText(/SHA-256 9f3a…c71e/i)).toBeInTheDocument();
  });

  it("renders Section 2: Introduction with verified editorial copy", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Some things are hard to verify by eye." })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Haven examines indicators and builds a record of what it observed/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Exhibit A · video received by message, 14 Mar/i)).toBeInTheDocument();
    expect(screen.getByText(/Exhibit A · frame 214, enlarged crop/i)).toBeInTheDocument();
  });

  it("renders Section 3: All 4 distinct Capabilities panels in the track", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "Capabilities" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Frame by frame" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Side by side" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "An investigation log" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "A readable report" })).toBeInTheDocument();
  });

  it("renders Section 4: How Haven Works with all 5 sequential steps", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "How Haven works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Drop the file" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Examine frame by frame" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Review what it found" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Add what you know" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Export the record" })).toBeInTheDocument();
  });

  it("renders Section 5: Final CTA with direct action to open Haven", () => {
    const handleExplore = vi.fn();
    render(<LandingPage onEnterWorkspace={handleExplore} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Start with the file you have." })
    ).toBeInTheDocument();

    const ctaBtns = screen.getAllByRole("button", { name: /Open Haven/i });
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
    expect(screen.getByRole("link", { name: "How it works" })).toBeInTheDocument();
  });
});
