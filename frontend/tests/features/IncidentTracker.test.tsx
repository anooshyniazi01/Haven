import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncidentTracker } from "../../src/features/incidents/IncidentTracker";
import * as incidentService from "../../src/services/incident";
import * as evidenceService from "../../src/services/evidence";
import { IncidentDetail, IncidentItem } from "../../src/types/incident";

const mockIncidents: IncidentItem[] = [
  {
    id: "inc-101",
    title: "Anonymous Telegram Threat",
    description: "Perpetrator demanded $5,000 in crypto within 48 hours.",
    incident_date: "2026-10-15",
    status: "open",
    evidence_count: 1,
    created_at: "2026-10-18T08:00:00Z",
    updated_at: "2026-10-18T08:30:00Z",
  },
  {
    id: "inc-102",
    title: "Email Extortion Campaign",
    description: "Sent from disposable email address.",
    incident_date: null,
    status: "documented",
    evidence_count: 0,
    created_at: "2026-10-18T09:00:00Z",
    updated_at: "2026-10-18T09:00:00Z",
  },
];

const mockDetail: IncidentDetail = {
  ...mockIncidents[0],
  linked_evidence: [
    {
      id: "ev-501",
      original_filename: "blackmail_screenshot.png",
      file_size_bytes: 524288,
      mime_type_detected: "image/png",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      created_at: "2026-10-18T07:50:00Z",
      linked_at: "2026-10-18T08:05:00Z",
      file_exists: true,
    },
  ],
};

describe("IncidentTracker Feature Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state when no incidents exist", async () => {
    vi.spyOn(incidentService, "listIncidents").mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });

    render(<IncidentTracker />);

    await waitFor(() => {
      expect(screen.getByText("No Incidents Documented Yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Create your first incident record to organize threats/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Document First Incident" })
    ).toBeInTheDocument();
  });

  it("renders list of documented incidents with status badges and evidence counts", async () => {
    vi.spyOn(incidentService, "listIncidents").mockResolvedValueOnce({
      items: mockIncidents,
      total: 2,
      limit: 10,
      offset: 0,
    });

    render(<IncidentTracker />);

    await waitFor(() => {
      expect(screen.getByText("Anonymous Telegram Threat")).toBeInTheDocument();
      expect(screen.getByText("Email Extortion Campaign")).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText("Open Case")).toBeInTheDocument();
    expect(screen.getAllByText("Documented").length).toBeGreaterThanOrEqual(1);

    // Check evidence count labels
    expect(screen.getByText("1 item")).toBeInTheDocument();
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  it("opens create modal, validates required title, and creates an incident", async () => {
    vi.spyOn(incidentService, "listIncidents").mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });
    vi.spyOn(evidenceService, "listEvidence").mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 100,
      offset: 0,
    });
    const createSpy = vi.spyOn(incidentService, "createIncident").mockResolvedValueOnce(mockDetail);
    vi.spyOn(incidentService, "getIncidentById").mockResolvedValueOnce(mockDetail);

    render(<IncidentTracker />);

    await waitFor(() => {
      expect(screen.getByText("No Incidents Documented Yet")).toBeInTheDocument();
    });

    // Click Document New Incident button
    const openBtn = screen.getByRole("button", { name: "Document New Incident" });
    await userEvent.click(openBtn);

    expect(screen.getByRole("heading", { level: 2, name: "Document New Incident" })).toBeInTheDocument();

    // Enter title and submit
    const titleInput = screen.getByLabelText(/Incident Title/i);
    await userEvent.type(titleInput, "New Harassment Report");

    const submitBtn = screen.getByRole("button", { name: "Document Incident" });
    await userEvent.click(submitBtn);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Harassment Report",
        status: "open",
      })
    );
  });

  it("opens incident details, shows timeline milestones and attached evidence", async () => {
    vi.spyOn(incidentService, "listIncidents").mockResolvedValueOnce({
      items: mockIncidents,
      total: 2,
      limit: 10,
      offset: 0,
    });
    vi.spyOn(incidentService, "getIncidentById").mockResolvedValueOnce(mockDetail);

    const onNavigateToVault = vi.fn();
    render(<IncidentTracker onNavigateToVault={onNavigateToVault} />);

    await waitFor(() => {
      expect(screen.getByText("Anonymous Telegram Threat")).toBeInTheDocument();
    });

    const viewBtn = screen.getByRole("button", {
      name: "View details of Anonymous Telegram Threat",
    });
    await userEvent.click(viewBtn);

    await waitFor(() => {
      expect(screen.getByText("Chronological Case Milestones")).toBeInTheDocument();
    });

    // Verify timeline elements
    expect(screen.getByText("Reported Occurrence Date")).toBeInTheDocument();
    expect(screen.getByText("Documented in Haven Workspace")).toBeInTheDocument();
    expect(screen.getByText(/Evidence Linked: blackmail_screenshot.png/i)).toBeInTheDocument();

    // Verify attached evidence
    expect(screen.getByText("blackmail_screenshot.png")).toBeInTheDocument();
    expect(screen.getByText("Preserved")).toBeInTheDocument();

    // Test vault navigation CTA
    const vaultBtn = screen.getByRole("button", { name: "View blackmail_screenshot.png in Vault" });
    await userEvent.click(vaultBtn);
    expect(onNavigateToVault).toHaveBeenCalledWith("ev-501");
  });

  it("shows delete confirmation dialog and preserves evidence safety", async () => {
    vi.spyOn(incidentService, "listIncidents").mockResolvedValueOnce({
      items: mockIncidents,
      total: 2,
      limit: 10,
      offset: 0,
    });
    const deleteSpy = vi.spyOn(incidentService, "deleteIncident").mockResolvedValueOnce({
      id: "inc-101",
      deleted: true,
      message: "Deleted",
    });

    render(<IncidentTracker />);

    await waitFor(() => {
      expect(screen.getByText("Anonymous Telegram Threat")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: "Delete Anonymous Telegram Threat" });
    await userEvent.click(deleteBtn);

    // Confirmation dialog appears
    expect(screen.getByRole("heading", { name: "Delete Incident Record?" })).toBeInTheDocument();
    expect(screen.getByText(/Evidence Safety Guarantee:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Preserved evidence files and their SHA-256 records will remain completely intact/i)
    ).toBeInTheDocument();

    // Test cancel
    const cancelBtn = screen.getByRole("button", { name: "Cancel deletion" });
    await userEvent.click(cancelBtn);
    expect(deleteSpy).not.toHaveBeenCalled();

    // Reopen and confirm delete
    await userEvent.click(deleteBtn);
    const confirmBtn = screen.getByRole("button", { name: "Confirm Delete Incident" });
    await userEvent.click(confirmBtn);

    expect(deleteSpy).toHaveBeenCalledWith("inc-101");
  });

  it("handles backend error when loading incidents", async () => {
    vi.spyOn(incidentService, "listIncidents").mockRejectedValueOnce(
      new Error("Database connection refused")
    );

    render(<IncidentTracker />);

    await waitFor(() => {
      expect(screen.getByText("Incident Tracker Error")).toBeInTheDocument();
      expect(screen.getByText(/Database connection refused/i)).toBeInTheDocument();
    });
  });
});
