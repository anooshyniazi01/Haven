import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";
import * as healthService from "../../src/services/health";
import * as evidenceService from "../../src/services/evidence";
import * as incidentService from "../../src/services/incident";

describe("App Root Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Evidence Vault by default and allows switching between Incident Tracker, Analyze Image, Evidence Intake, and System Health", async () => {
    vi.spyOn(healthService, "checkBackendHealth").mockResolvedValue({ status: "ok" });
    vi.spyOn(healthService, "checkSystemStatus").mockResolvedValue({
      status: "ready",
      database: "connected",
      analysis_engine: "available",
    });
    vi.spyOn(evidenceService, "listEvidence").mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });
    vi.spyOn(incidentService, "listIncidents").mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });

    render(<App />);

    // Header brand & landmarks
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Haven" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Default tab is Evidence Vault
    expect(
      screen.getByRole("heading", { level: 1, name: "Evidence Vault" })
    ).toBeInTheDocument();

    // Check system status dot updates
    await waitFor(() => {
      expect(screen.getByText("System Operational")).toBeInTheDocument();
    });

    // Switch to Incident Tracker tab
    const incidentsTab = screen.getByRole("tab", { name: "Incident Tracker" });
    await userEvent.click(incidentsTab);

    expect(
      screen.getByRole("heading", { level: 1, name: "Incident Tracker" })
    ).toBeInTheDocument();

    // Switch to Analyze Image tab
    const analysisTab = screen.getByRole("tab", { name: "Analyze Image" });
    await userEvent.click(analysisTab);

    expect(
      screen.getByRole("heading", { level: 1, name: "Technical Image Inspection" })
    ).toBeInTheDocument();

    // Switch to Evidence Intake tab
    const intakeTab = screen.getByRole("tab", { name: "Evidence Intake" });
    await userEvent.click(intakeTab);

    expect(
      screen.getByRole("heading", { level: 2, name: "Secure Evidence Intake" })
    ).toBeInTheDocument();

    // Switch to System Health tab
    const healthTab = screen.getByRole("tab", { name: "System Health" });
    await userEvent.click(healthTab);

    // Verify System Health Monitor rendered
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: "System Health & Readiness" })
      ).toBeInTheDocument();
      expect(screen.getByText("OK")).toBeInTheDocument();
      expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    });

    // Switch back to Evidence Vault tab
    const vaultTab = screen.getByRole("tab", { name: "Evidence Vault" });
    await userEvent.click(vaultTab);

    expect(
      screen.getByRole("heading", { level: 1, name: "Evidence Vault" })
    ).toBeInTheDocument();
  });
});
