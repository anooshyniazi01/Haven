import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageAnalyzer } from "../../src/features/analysis/ImageAnalyzer";
import * as analysisService from "../../src/services/analysis";
import { AnalysisResponse } from "../../src/types/analysis";

const mockSuccessReport: AnalysisResponse = {
  id: "analysis-test-123",
  original_filename: "suspect_image.png",
  file_size_bytes: 524288,
  mime_type_detected: "image/png",
  sha256: "4bd44765c01871940ab0ac891768427893665756779b932bc106d9ecb38d2b16",
  status: "completed",
  analysis_method: "technical_image_inspection",
  model_name: null,
  model_version: null,
  created_at: "2026-10-17T08:00:00Z",
  completed_at: "2026-10-17T08:00:05Z",
  updated_at: "2026-10-17T08:00:05Z",
  evidence_id: "evidence-test-456",
  result: {
    label: "technical_inspection_completed",
    score: null,
    score_type: null,
    explanation: "Technical inspection verified a PNG image with dimensions 1920x1080 (16:9, 2.07 MP) in RGB color mode (8-bit, 3 channels).",
    limitations: [
      "Technical image inspection measures observable digital properties and file encoding.",
      "The presence or absence of EXIF metadata is not proof of authenticity or manipulation.",
      "File byte hashing (SHA-256) verifies that stored bytes match a recorded digest.",
      "No automated forensic tool can independently determine whether an image is genuine or fraudulent.",
    ],
    technical_inspection: {
      dimensions: {
        width: 1920,
        height: 1080,
        aspect_ratio: "16:9",
        total_pixels: 2073600,
        megapixels: 2.07,
      },
      format: "PNG",
      mime_type: "image/png",
      mode: "RGB",
      color_channels: 3,
      bit_depth: 8,
      has_transparency: false,
      color_profile_present: true,
      file_size_bytes: 524288,
      compression_ratio: 11.86,
      metadata_summary: {
        has_exif: true,
        tags_present: {
          "Camera Make": "CameraBrand",
          "Camera Model": "Model-Z",
        },
        tags_absent: ["Software / Editing Tag"],
        gps_status: "present_redacted_for_privacy",
        note: "Missing metadata is standard on modern communication and social media platforms.",
      },
      anomalies: [
        {
          category: "privacy_alert",
          description: "GPS geolocation tags were detected in the file metadata. For your safety, raw coordinates are withheld.",
          severity: "info",
        },
      ],
      ai_model_status: "Model-based synthetic/manipulation classification is currently unavailable. No evaluated model is approved under docs/MODEL_EVALUATION.md.",
    },
  },
};

describe("ImageAnalyzer Feature Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the initial view with heading and evidence input", () => {
    render(<ImageAnalyzer />);
    expect(screen.getByRole("heading", { name: "Technical Image Inspection", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Evidence Record UUID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Technical Inspection" })).toBeInTheDocument();
  });

  it("displays validation error when trying to run with empty evidence ID", async () => {
    render(<ImageAnalyzer />);
    const runBtn = screen.getByRole("button", { name: "Run Technical Inspection" });
    // Button is disabled when input is empty
    expect(runBtn).toBeDisabled();
  });

  it("runs analysis on evidence ID and renders full inspection report", async () => {
    const analyzeSpy = vi
      .spyOn(analysisService, "analyzeEvidence")
      .mockResolvedValueOnce(mockSuccessReport);

    render(<ImageAnalyzer />);
    const input = screen.getByLabelText("Evidence Record UUID");
    await userEvent.type(input, "evidence-test-456");

    const runBtn = screen.getByRole("button", { name: "Run Technical Inspection" });
    await userEvent.click(runBtn);

    expect(analyzeSpy).toHaveBeenCalledWith("evidence-test-456");

    await waitFor(() => {
      expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
    });

    // Check header and summary
    expect(screen.getByText("suspect_image.png")).toBeInTheDocument();
    expect(screen.getByText(/Technical inspection verified a PNG image/i)).toBeInTheDocument();

    // Check dimensions
    expect(screen.getByText("1920 × 1080 px")).toBeInTheDocument();
    expect(screen.getByText("16:9")).toBeInTheDocument();
    expect(screen.getAllByText(/2.07 MP/i).length).toBeGreaterThanOrEqual(1);

    // Check metadata tags
    expect(screen.getByText("Camera Make")).toBeInTheDocument();
    expect(screen.getByText("CameraBrand")).toBeInTheDocument();
    expect(screen.getByText("Model-Z")).toBeInTheDocument();

    // Check privacy guard (GPS coordinates redacted)
    expect(screen.getByText(/GPS Data: Present \(Redacted for Privacy\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/GPSLatitude/i)).not.toBeInTheDocument();

    // Check limitations
    expect(screen.getByText(/The presence or absence of EXIF metadata is not proof/i)).toBeInTheDocument();
    expect(screen.getByText(/Model-based synthetic\/manipulation classification is currently unavailable/i)).toBeInTheDocument();
  });

  it("handles backend rejection and displays clear error message", async () => {
    vi.spyOn(analysisService, "analyzeEvidence").mockRejectedValueOnce({
      message: "Evidence record 'ev-not-found' does not exist.",
    });

    render(<ImageAnalyzer />);
    const input = screen.getByLabelText("Evidence Record UUID");
    await userEvent.type(input, "ev-not-found");

    const runBtn = screen.getByRole("button", { name: "Run Technical Inspection" });
    await userEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText("Analysis Request Failed")).toBeInTheDocument();
      expect(screen.getByText("Evidence record 'ev-not-found' does not exist.")).toBeInTheDocument();
    });
  });

  it("supports direct image upload mode and triggers upload & inspection", async () => {
    const uploadSpy = vi
      .spyOn(analysisService, "createAnalysisFromUpload")
      .mockResolvedValueOnce({
        id: "analysis-upload-1",
        filename: "fresh.png",
        status: "uploaded",
        created_at: "2026-10-17T08:00:00Z",
        saved_to_vault: true,
      });

    const runSpy = vi
      .spyOn(analysisService, "runAnalysis")
      .mockResolvedValueOnce({
        ...mockSuccessReport,
        id: "analysis-upload-1",
        original_filename: "fresh.png",
      });

    render(<ImageAnalyzer />);
    const uploadModeBtn = screen.getByRole("button", { name: "Upload New Image" });
    await userEvent.click(uploadModeBtn);

    const fileInput = screen.getByLabelText(/Choose Image/i);
    const testFile = new File(["dummy"], "fresh.png", { type: "image/png" });
    await userEvent.upload(fileInput, testFile);

    const submitBtn = screen.getByRole("button", { name: "Upload & Run Technical Inspection" });
    await userEvent.click(submitBtn);

    expect(uploadSpy).toHaveBeenCalledWith(testFile, true);
    expect(runSpy).toHaveBeenCalledWith("analysis-upload-1");

    await waitFor(() => {
      expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
      expect(screen.getByText("fresh.png")).toBeInTheDocument();
    });
  });

  it("copies SHA-256 digest to clipboard", async () => {
    vi.spyOn(analysisService, "analyzeEvidence").mockResolvedValueOnce(mockSuccessReport);
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(<ImageAnalyzer initialEvidenceId="evidence-test-456" />);

    await waitFor(() => {
      expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole("button", { name: "Copy SHA-256 Digest" });
    await userEvent.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(mockSuccessReport.sha256);
  });

  it("renders Export PDF Report button on completed inspection report and initiates download", async () => {
    vi.spyOn(analysisService, "analyzeEvidence").mockResolvedValueOnce(mockSuccessReport);
    const mockBlob = new Blob(["%PDF-1.4 mock content"], { type: "application/pdf" });
    const exportSpy = vi
      .spyOn(analysisService, "exportAnalysisPdf")
      .mockResolvedValueOnce(mockBlob);

    // Mock createObjectURL
    const createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-pdf-url");
    window.URL.createObjectURL = createObjectURLSpy;

    render(<ImageAnalyzer initialEvidenceId="evidence-test-456" />);

    await waitFor(() => {
      expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: "Export PDF Report" });
    expect(exportBtn).toBeInTheDocument();

    await userEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalledWith("analysis-test-123");
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
  });

  it("displays error banner when PDF export fails", async () => {
    vi.spyOn(analysisService, "analyzeEvidence").mockResolvedValueOnce(mockSuccessReport);
    vi.spyOn(analysisService, "exportAnalysisPdf").mockRejectedValueOnce(
      new Error("Server returned HTTP 409: Analysis is not completed.")
    );

    render(<ImageAnalyzer initialEvidenceId="evidence-test-456" />);

    await waitFor(() => {
      expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: "Export PDF Report" });
    await userEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText("Export Failed")).toBeInTheDocument();
      expect(
        screen.getByText("Server returned HTTP 409: Analysis is not completed.")
      ).toBeInTheDocument();
    });
  });

  it("renders AI-Generated Image Detection findings when ai_forensics is present in result", async () => {
    const reportWithAi: typeof mockSuccessReport = {
      ...mockSuccessReport,
      analysis_method: "technical_and_ai_synthetic_inspection",
      result: {
        ...mockSuccessReport.result!,
        ai_forensics: {
          task: "AI-Generated Image Detection",
          model_name: "ai-image-detect-distilled-onnx",
          model_version: "v1.0.0",
          status: "success",
          synthetic_likelihood: 0.8542,
          indicator: "elevated_synthetic_signal",
          latency_ms: 54.2,
          score_semantics: "Uncalibrated raw model estimate (0.0 to 1.0). Not a definitive proof of authenticity.",
          limitations: [
            "Trained on specific generative models (e.g. Midjourney, Stable Diffusion).",
            "Compression or resizing may degrade detector accuracy.",
          ],
        },
      },
    };

    vi.spyOn(analysisService, "analyzeEvidence").mockResolvedValueOnce(reportWithAi);

    render(<ImageAnalyzer initialEvidenceId="evidence-test-456" />);

    await waitFor(() => {
      expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
    });

    expect(screen.getByText("Method: Technical & AI Inspection")).toBeInTheDocument();
    expect(screen.getByText("AI Detection: 85.4% Synthetic Likelihood")).toBeInTheDocument();
    expect(screen.getByText("AI-Generated Image Detection")).toBeInTheDocument();
    expect(screen.getByText("Elevated Synthetic Signal (>=75%)")).toBeInTheDocument();
    expect(screen.getByText("85.4%")).toBeInTheDocument();
    expect(screen.getByText(/Raw output score: 0.8542/i)).toBeInTheDocument();
    expect(screen.getByText(/CPU Latency: 54.2 ms/i)).toBeInTheDocument();
    expect(screen.getByText(/Trained on specific generative models/i)).toBeInTheDocument();
  });

  it("renders AI Detection Failed alert when ai_forensics status is failed", async () => {
    const reportWithFailedAi: typeof mockSuccessReport = {
      ...mockSuccessReport,
      result: {
        ...mockSuccessReport.result!,
        ai_forensics: {
          task: "AI-Generated Image Detection",
          model_name: "ai-image-detect-distilled-onnx",
          model_version: "v1.0.0",
          status: "failed",
          synthetic_likelihood: null,
          indicator: null,
          latency_ms: null,
          score_semantics: "Uncalibrated raw model estimate.",
          limitations: [],
          error_message: "Image dimensions (32x32) smaller than minimum forensic resolution (64x64).",
        },
      },
    };

    vi.spyOn(analysisService, "analyzeEvidence").mockResolvedValueOnce(reportWithFailedAi);

    render(<ImageAnalyzer initialEvidenceId="evidence-test-456" />);

    await waitFor(() => {
      expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
    });

    expect(screen.getByText("AI Detection: Failed")).toBeInTheDocument();
    expect(screen.getByText("AI Detection Failed")).toBeInTheDocument();
    expect(screen.getByText(/smaller than minimum forensic resolution/i)).toBeInTheDocument();
  });
});
