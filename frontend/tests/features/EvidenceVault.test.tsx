import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvidenceVault } from "../../src/features/vault/EvidenceVault";
import * as evidenceService from "../../src/services/evidence";
import * as analysisService from "../../src/services/analysis";
import { EvidenceDetailResponse, EvidenceItem } from "../../src/types/evidence";

const mockEvidenceList: EvidenceItem[] = [
  {
    id: "ev-101",
    original_filename: "blackmail_threat_photo.jpg",
    file_size_bytes: 1048576,
    mime_type_detected: "image/jpeg",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    description: "Sender demanded payment within 24 hours.",
    created_at: "2026-10-17T08:00:00Z",
    analysis_id: "an-202",
    has_analysis: true,
    analysis_status: "completed",
  },
  {
    id: "ev-102",
    original_filename: "uninspected_screenshot.png",
    file_size_bytes: 204800,
    mime_type_detected: "image/png",
    sha256: "4bd44765c01871940ab0ac891768427893665756779b932bc106d9ecb38d2b16",
    description: null,
    created_at: "2026-10-17T07:30:00Z",
    analysis_id: null,
    has_analysis: false,
    analysis_status: null,
  },
];

const mockDetailItem: EvidenceDetailResponse = {
  ...mockEvidenceList[0],
  file_exists: true,
  analysis_summary: {
    id: "an-202",
    status: "completed",
    analysis_method: "technical_image_inspection",
    result_label: "technical_inspection_completed",
    completed_at: "2026-10-17T08:05:00Z",
    explanation: "Observed JPEG image with dimensions 1920x1080 (16:9 aspect ratio) in RGB mode.",
    limitations: [
      "Technical image inspection measures observable digital properties and file encoding.",
      "The presence or absence of EXIF metadata is not proof of authenticity or manipulation.",
    ],
  },
};

describe("EvidenceVault Feature Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state when no evidence exists", async () => {
    vi.spyOn(evidenceService, "listEvidence").mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });

    const onNavigateToIntake = vi.fn();
    render(<EvidenceVault onNavigateToIntake={onNavigateToIntake} />);

    await waitFor(() => {
      expect(screen.getByText("Evidence Vault is Empty")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/No media has been preserved in the Evidence Vault yet/i)
    ).toBeInTheDocument();

    const uploadBtn = screen.getByRole("button", { name: "Upload Evidence Now" });
    await userEvent.click(uploadBtn);
    expect(onNavigateToIntake).toHaveBeenCalledTimes(1);
  });

  it("renders list of preserved evidence with details and badges", async () => {
    vi.spyOn(evidenceService, "listEvidence").mockResolvedValueOnce({
      items: mockEvidenceList,
      total: 2,
      limit: 10,
      offset: 0,
    });

    render(<EvidenceVault />);

    await waitFor(() => {
      expect(screen.getByText("blackmail_threat_photo.jpg")).toBeInTheDocument();
      expect(screen.getByText("uninspected_screenshot.png")).toBeInTheDocument();
    });

    // Check filenames, sizes, and formats
    expect(screen.getByText("JPEG")).toBeInTheDocument();
    expect(screen.getByText("PNG")).toBeInTheDocument();
    expect(screen.getByText("1 MB")).toBeInTheDocument();
    expect(screen.getByText("200 KB")).toBeInTheDocument();

    // Check inspection status badges
    expect(screen.getByText("Report Available")).toBeInTheDocument();
    expect(screen.getAllByText("No Report").length).toBeGreaterThanOrEqual(1);

    // Check description
    expect(screen.getByText("Sender demanded payment within 24 hours.")).toBeInTheDocument();
  });

  it("opens detail drawer with analysis summary when 'View Details' is clicked", async () => {
    vi.spyOn(evidenceService, "listEvidence").mockResolvedValueOnce({
      items: mockEvidenceList,
      total: 2,
      limit: 10,
      offset: 0,
    });
    vi.spyOn(evidenceService, "getEvidenceById").mockResolvedValueOnce(mockDetailItem);

    const onViewReport = vi.fn();
    render(<EvidenceVault onViewReport={onViewReport} />);

    await waitFor(() => {
      expect(screen.getByText("blackmail_threat_photo.jpg")).toBeInTheDocument();
    });

    const detailBtn = screen.getByRole("button", {
      name: "View details of blackmail_threat_photo.jpg",
    });
    await userEvent.click(detailBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Evidence Details: blackmail_threat_photo.jpg")
      ).toBeInTheDocument();
    });

    // Check detail attributes
    expect(screen.getByText("File Stored Securely")).toBeInTheDocument();
    expect(screen.getByText("image/jpeg")).toBeInTheDocument();
    expect(
      screen.getByText(/Observed JPEG image with dimensions 1920x1080/i)
    ).toBeInTheDocument();

    // Check report navigation CTA
    const reportBtn = screen.getByRole("button", {
      name: "View Full Inspection Report",
    });
    await userEvent.click(reportBtn);
    expect(onViewReport).toHaveBeenCalledWith("ev-101");
  });

  it("performs real-time cryptographic integrity check", async () => {
    vi.spyOn(evidenceService, "listEvidence").mockResolvedValueOnce({
      items: mockEvidenceList,
      total: 2,
      limit: 10,
      offset: 0,
    });
    vi.spyOn(evidenceService, "verifyEvidenceIntegrity").mockResolvedValueOnce({
      evidence_id: "ev-101",
      status: "match",
      recorded_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      computed_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      verified_at: "2026-10-17T08:30:00Z",
      message: "The cryptographic SHA-256 hash of the stored file exactly matches the recorded baseline hash.",
      disclaimer: "A matching hash confirms byte preservation since intake.",
    });

    render(<EvidenceVault />);

    await waitFor(() => {
      expect(screen.getByText("blackmail_threat_photo.jpg")).toBeInTheDocument();
    });

    const verifyBtn = screen.getByRole("button", {
      name: "Verify integrity of blackmail_threat_photo.jpg",
    });
    await userEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText(/SHA-256 Match Verified:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/The cryptographic SHA-256 hash of the stored file exactly matches/i)
      ).toBeInTheDocument();
    });
  });

  it("handles backend error when loading vault", async () => {
    vi.spyOn(evidenceService, "listEvidence").mockRejectedValueOnce(
      new Error("Network connection error: failed to fetch")
    );

    render(<EvidenceVault />);

    await waitFor(() => {
      expect(screen.getByText("Vault Error")).toBeInTheDocument();
      expect(
        screen.getByText(/Network connection error: failed to fetch/i)
      ).toBeInTheDocument();
    });
  });

  it("exports PDF report from detail view when analysis is available", async () => {
    vi.spyOn(evidenceService, "listEvidence").mockResolvedValueOnce({
      items: mockEvidenceList,
      total: 2,
      limit: 10,
      offset: 0,
    });
    vi.spyOn(evidenceService, "getEvidenceById").mockResolvedValueOnce(mockDetailItem);

    const mockBlob = new Blob(["%PDF-1.4 mock content"], { type: "application/pdf" });
    const exportSpy = vi
      .spyOn(analysisService, "exportAnalysisPdf")
      .mockResolvedValueOnce(mockBlob);

    const createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-pdf-url");
    window.URL.createObjectURL = createObjectURLSpy;

    render(<EvidenceVault />);

    await waitFor(() => {
      expect(screen.getByText("blackmail_threat_photo.jpg")).toBeInTheDocument();
    });

    const detailBtn = screen.getByRole("button", {
      name: "View details of blackmail_threat_photo.jpg",
    });
    await userEvent.click(detailBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Evidence Details: blackmail_threat_photo.jpg")
      ).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: "Export PDF Report" });
    expect(exportBtn).toBeInTheDocument();

    await userEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalledWith("an-202");
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
  });

  it("displays error in detail view when PDF export fails", async () => {
    vi.spyOn(evidenceService, "listEvidence").mockResolvedValueOnce({
      items: mockEvidenceList,
      total: 2,
      limit: 10,
      offset: 0,
    });
    vi.spyOn(evidenceService, "getEvidenceById").mockResolvedValueOnce(mockDetailItem);
    vi.spyOn(analysisService, "exportAnalysisPdf").mockRejectedValueOnce(
      new Error("PDF export failed on server.")
    );

    render(<EvidenceVault />);

    await waitFor(() => {
      expect(screen.getByText("blackmail_threat_photo.jpg")).toBeInTheDocument();
    });

    const detailBtn = screen.getByRole("button", {
      name: "View details of blackmail_threat_photo.jpg",
    });
    await userEvent.click(detailBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Evidence Details: blackmail_threat_photo.jpg")
      ).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: "Export PDF Report" });
    await userEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText("Export Failed")).toBeInTheDocument();
      expect(screen.getByText("PDF export failed on server.")).toBeInTheDocument();
    });
  });
});
