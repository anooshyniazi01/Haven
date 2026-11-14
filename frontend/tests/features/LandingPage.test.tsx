import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingPage } from "../../src/features/landing/LandingPage";

describe("LandingPage Complete Experience Suite", () => {
  it("renders Section 1: Hero with confident wordmark, tagline, and rounded pill drop zone", () => {
    const handleExplore = vi.fn();
    render(<LandingPage onEnterWorkspace={handleExplore} />);

    // Wordmark
    const wordmarks = screen.getAllByText("Haven");
    expect(wordmarks.length).toBeGreaterThanOrEqual(1);

    // Tagline & description
    expect(screen.getByText("Your digital safety workspace.")).toBeInTheDocument();
    expect(
      screen.getByText(/Upload a photo or video that looks off\. See what's been altered/i)
    ).toBeInTheDocument();

    // Rounded Pill Drop Zone
    expect(screen.getByText("Drop an image or video here")).toBeInTheDocument();
    expect(screen.getByText(/JPG, PNG, MP4\. Stays in your browser\./i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /or see how it works →/i })).toBeInTheDocument();

    // View mode filters
    expect(screen.getByRole("button", { name: "Original" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Error level" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Noise" })).toBeInTheDocument();

    // Specimen note & computed SHA-256
    expect(screen.getByText(/Specimen · altered background object/i)).toBeInTheDocument();
    expect(screen.getByText(/SHA-256: 97e0959c…101df135/i)).toBeInTheDocument();
  });

  it("renders Section 2: Introduction with verified editorial copy and dual exhibits", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Not everything online is what it appears to be." })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A clip that looks real can be edited\. A clip that looks fake can be genuine/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exhibit A · submitted media received by message/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exhibit A · region 1, background cloned frame/i)
    ).toBeInTheDocument();
  });

  it("renders Section 3: All 4 Capabilities interactively updating live captions and stage behaviors", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "Capabilities" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Look closely" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Mark what looks off" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Keep a record" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Share a report" })).toBeInTheDocument();

    // Test clicking capability 2
    fireEvent.click(screen.getByRole("tab", { name: /Mark what looks off/i }));
    expect(screen.getByText(/Region 1 \(suspect frame\) vs reference 2/i)).toBeInTheDocument();

    // Test clicking capability 3
    fireEvent.click(screen.getByRole("tab", { name: /Keep a record/i }));
    expect(screen.getByText(/Timeline updated · 4 entries recorded/i)).toBeInTheDocument();

    // Test clicking capability 4
    fireEvent.click(screen.getByRole("tab", { name: /Share a report/i }));
    expect(screen.getByText(/Report compiled · Ready to export/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download sample/i })).toBeInTheDocument();
  });

  it("renders Section 4: How Haven Works scroll story narrative", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("region", { name: "How Haven works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Upload suspicious media" })).toBeInTheDocument();
    expect(screen.getByText(/Bring in the image or video you want to examine/i)).toBeInTheDocument();
  });

  it("renders Section 5: Closing Section with pill drop zone and Open Haven CTA", () => {
    const handleExplore = vi.fn();
    render(<LandingPage onEnterWorkspace={handleExplore} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Make sense of what you see." })
    ).toBeInTheDocument();
    expect(screen.getByText("Drop in the file you're unsure about.")).toBeInTheDocument();

    const openButtons = screen.getAllByRole("button", { name: /Open Haven/i });
    fireEvent.click(openButtons[openButtons.length - 1]);
    expect(handleExplore).toHaveBeenCalled();
  });

  it("renders Section 6: Editorial Footer with required prototype notice and support links", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByText(/© 2026 Haven\. A prototype: results show indicators only and don't prove authenticity\./i)
    ).toBeInTheDocument();
    expect(screen.getByText("Take It Down (NCMEC)")).toBeInTheDocument();
    expect(screen.getByText("StopNCII.org")).toBeInTheDocument();
    expect(screen.getByText("Cyber Civil Rights Initiative")).toBeInTheDocument();
    expect(screen.getByText("GitHub Repository")).toBeInTheDocument();
  });
});
