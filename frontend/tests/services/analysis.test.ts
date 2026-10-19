import { describe, it, expect, vi, beforeEach } from "vitest";
import * as apiClient from "../../src/services/api-client";
import {
  analyzeEvidence,
  createAnalysisFromEvidence,
  createAnalysisFromUpload,
  exportAnalysisPdf,
  getAnalysisById,
  listAnalyses,
  runAnalysis,
} from "../../src/services/analysis";

describe("analysis service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/v1/analyses with file upload", async () => {
    const mockUpload = {
      id: "analysis-1",
      filename: "test.png",
      status: "uploaded" as const,
      created_at: "2026-10-17T08:00:00Z",
      saved_to_vault: false,
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockUpload);

    const file = new File(["bytes"], "test.png", { type: "image/png" });
    const res = await createAnalysisFromUpload(file, false);

    expect(apiSpy).toHaveBeenCalledWith(
      "/api/v1/analyses",
      expect.objectContaining({ method: "POST" })
    );
    expect(res).toEqual(mockUpload);
  });

  it("calls POST /api/v1/analyses with evidence_id", async () => {
    const mockUpload = {
      id: "analysis-2",
      filename: "evidence.png",
      status: "uploaded" as const,
      created_at: "2026-10-17T08:00:00Z",
      saved_to_vault: true,
      evidence_id: "ev-123",
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockUpload);

    const res = await createAnalysisFromEvidence("ev-123");
    expect(apiSpy).toHaveBeenCalledWith(
      "/api/v1/analyses",
      expect.objectContaining({ method: "POST" })
    );
    expect(res).toEqual(mockUpload);
  });

  it("calls POST /api/v1/analyses/{id}/run", async () => {
    const mockResponse = {
      id: "analysis-1",
      original_filename: "test.png",
      file_size_bytes: 1024,
      mime_type_detected: "image/png",
      sha256: "abc",
      status: "completed" as const,
      analysis_method: "technical_image_inspection",
      created_at: "2026-10-17T08:00:00Z",
      updated_at: "2026-10-17T08:01:00Z",
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockResponse);

    const res = await runAnalysis("analysis-1");
    expect(apiSpy).toHaveBeenCalledWith(
      "/api/v1/analyses/analysis-1/run",
      expect.objectContaining({ method: "POST" })
    );
    expect(res).toEqual(mockResponse);
  });

  it("calls GET /api/v1/analyses/{id}", async () => {
    const mockReport = {
      id: "analysis-1",
      original_filename: "test.png",
      file_size_bytes: 1024,
      mime_type_detected: "image/png",
      sha256: "abc",
      status: "completed" as const,
      created_at: "2026-10-17T08:00:00Z",
      updated_at: "2026-10-17T08:01:00Z",
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockReport);

    const res = await getAnalysisById("analysis-1");
    expect(apiSpy).toHaveBeenCalledWith("/api/v1/analyses/analysis-1");
    expect(res).toEqual(mockReport);
  });

  it("calls POST /api/v1/evidence/{id}/analyze convenience route", async () => {
    const mockReport = {
      id: "analysis-99",
      original_filename: "photo.jpg",
      file_size_bytes: 2048,
      mime_type_detected: "image/jpeg",
      sha256: "def456",
      status: "completed" as const,
      evidence_id: "ev-99",
      created_at: "2026-10-17T08:00:00Z",
      updated_at: "2026-10-17T08:01:00Z",
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockReport);

    const res = await analyzeEvidence("ev-99");
    expect(apiSpy).toHaveBeenCalledWith(
      "/api/v1/evidence/ev-99/analyze",
      expect.objectContaining({ method: "POST" })
    );
    expect(res).toEqual(mockReport);
  });

  it("calls GET /api/v1/analyses with pagination parameters", async () => {
    const mockList = {
      items: [],
      total: 0,
      limit: 10,
      offset: 5,
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockList);

    const res = await listAnalyses(10, 5);
    expect(apiSpy).toHaveBeenCalledWith("/api/v1/analyses?limit=10&offset=5");
    expect(res).toEqual(mockList);
  });

  it("calls GET /api/v1/analyses/{id}/export and returns Blob", async () => {
    const mockBlob = new Blob(["%PDF-1.4 mock content"], { type: "application/pdf" });
    const apiSpy = vi.spyOn(apiClient, "apiBlobRequest").mockResolvedValueOnce(mockBlob);

    const res = await exportAnalysisPdf("analysis-123");
    expect(apiSpy).toHaveBeenCalledWith(
      "/api/v1/analyses/analysis-123/export",
      expect.objectContaining({ method: "GET" })
    );
    expect(res).toBe(mockBlob);
  });
});
