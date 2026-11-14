import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingPage } from "../../src/features/landing/LandingPage";

describe("LandingPage Human-Centered Redesign Suite", () => {
  it("renders Section 1: Hero with humanist H1, lead copy, primary CTA, and help strip", () => {
    const handleExamine = vi.fn();
    render(<LandingPage onEnterWorkspace={handleExamine} />);

    // Brand mark & logo
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("Haven")).toBeInTheDocument();

    // Humanist H1 and lead copy
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Something doesn't look right. Start by looking closer.",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Haven helps you examine a suspicious image or video, keep a clear record of what you find, and decide what to do next."
      )
    ).toBeInTheDocument();

    // CTAs: "Examine a file" and "See how it works"
    const examineButtons = screen.getAllByRole("button", { name: "Examine a file" });
    expect(examineButtons.length).toBeGreaterThanOrEqual(1);

    const seeHowItWorksLinks = screen.getAllByRole("link", { name: "See how it works" });
    expect(seeHowItWorksLinks.length).toBeGreaterThanOrEqual(1);

    // Support Resources Strip visible near top
    expect(screen.getByText("Take It Down (NCMEC) ↗")).toBeInTheDocument();
    expect(screen.getByText("StopNCII.org ↗")).toBeInTheDocument();
    expect(screen.getByText("Cyber Civil Rights Initiative ↗")).toBeInTheDocument();
  });

  it("renders Section 2: Concrete perspective and 12-col grid", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "A convincing clip isn't proof of anything. Neither is a doubtful one.",
      })
    ).toBeInTheDocument();

    expect(screen.getByText("Observed Media Frame")).toBeInTheDocument();
    expect(screen.getByText("Boundary Analysis Crop")).toBeInTheDocument();
    expect(screen.getByText("Technical Provenance Record")).toBeInTheDocument();
  });

  it("renders Section 3: Interactive Forensic Exhibit (single dark rhythm section)", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Interactive Media Inspection" })
    ).toBeInTheDocument();

    // View mode tabs
    expect(screen.getByRole("tab", { name: "Original View" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Error-Level (ELA)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Noise Pattern" })).toBeInTheDocument();

    // Frame sequence selector
    expect(screen.getByRole("radiogroup", { name: "Video frame selector" })).toBeInTheDocument();

    // Single consolidated prototype note
    expect(screen.getByText("Prototype — sample examination data")).toBeInTheDocument();
  });

  it("renders Section 4: Capabilities in plain human terms without jargon triplets", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Capabilities built for clarity and care" })
    ).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 3, name: "Look closely" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Check where it came from" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Keep a record" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Share a report" })).toBeInTheDocument();

    // Evidence Report Paper Sheet Dossier
    expect(screen.getByText("Haven Evidence Report")).toBeInTheDocument();
  });

  it("renders Section 5: How Haven Works with all 5 methodical stages", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "How Haven works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Upload suspicious media" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Frame-by-frame analysis" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Examine available indicators" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Document findings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Generate an evidence report" })).toBeInTheDocument();
  });

  it("renders Section 6 & 7: What Haven can't do (Trust Feature) and Privacy architecture", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "What Haven can't do" })).toBeInTheDocument();
    expect(screen.getByText("It does not prove absolute authenticity")).toBeInTheDocument();
    expect(screen.getByText("Local-First Architecture")).toBeInTheDocument();
    expect(screen.getByText("You Control Your Evidence")).toBeInTheDocument();
  });

  it("renders Section 8 & 9: Builder note and Final CTA triggering workspace transition", () => {
    const handleExamine = vi.fn();
    render(<LandingPage onEnterWorkspace={handleExamine} />);

    expect(screen.getByRole("heading", { level: 3, name: "Why I built Haven" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Got something you're unsure about? Bring it here." })
    ).toBeInTheDocument();

    const ctaBtns = screen.getAllByRole("button", { name: "Examine a file" });
    fireEvent.click(ctaBtns[ctaBtns.length - 1]);
    expect(handleExamine).toHaveBeenCalledTimes(1);
  });

  it("renders Section 10: Human-centered Footer with required columns and safety links", () => {
    render(<LandingPage onEnterWorkspace={vi.fn()} />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Product" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Get help" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Open source" })).toBeInTheDocument();

    expect(screen.getByText("© 2026 Haven.")).toBeInTheDocument();
  });
});
