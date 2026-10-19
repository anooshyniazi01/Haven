import { describe, it, expect, vi, beforeEach } from "vitest";
import * as apiClient from "../../src/services/api-client";
import {
  uploadEvidence,
  getEvidenceById,
  listEvidence,
  verifyEvidenceIntegrity,
} from "../../src/services/evidence";

describe("evidence service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/v1/evidence with FormData", async () => {
    const mockEvidence = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      original_filename: "test.jpg",
      file_size_bytes: 1024,
      mime_type_detected: "image/jpeg",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      description: "Sample note",
      created_at: "2026-10-17T07:00:00Z",
    };

    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockEvidence);

    const file = new File(["dummy content"], "test.jpg", { type: "image/jpeg" });
    const result = await uploadEvidence(file, "Sample note");

    expect(apiSpy).toHaveBeenCalledTimes(1);
    const [path, options] = apiSpy.mock.calls[0];
    expect(path).toBe("/api/v1/evidence");
    expect(options?.method).toBe("POST");
    expect(options?.body instanceof FormData).toBe(true);

    const formData = options?.body as FormData;
    expect(formData.get("file")).toBe(file);
    expect(formData.get("description")).toBe("Sample note");
    expect(result).toEqual(mockEvidence);
  });

  it("calls GET /api/v1/evidence/{id} for getEvidenceById", async () => {
    const mockEvidence = {
      id: "abc-123",
      original_filename: "photo.png",
      file_size_bytes: 2048,
      mime_type_detected: "image/png",
      sha256: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      description: null,
      created_at: "2026-10-17T07:10:00Z",
    };

    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockEvidence);

    const result = await getEvidenceById("abc-123");
    expect(apiSpy).toHaveBeenCalledWith("/api/v1/evidence/abc-123");
    expect(result).toEqual(mockEvidence);
  });

  it("calls GET /api/v1/evidence for listEvidence with query params", async () => {
    const mockList = {
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockList);

    const result = await listEvidence({ limit: 10, offset: 0, search: "blackmail", hasAnalysis: true });
    expect(apiSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/evidence?limit=10&offset=0&search=blackmail&has_analysis=true")
    );
    expect(result).toEqual(mockList);
  });

  it("calls POST /api/v1/evidence/{id}/verify for verifyEvidenceIntegrity", async () => {
    const mockVerification = {
      evidence_id: "abc-123",
      status: "match" as const,
      recorded_sha256: "hash123",
      computed_sha256: "hash123",
      verified_at: "2026-10-17T08:00:00Z",
      message: "Hash matches baseline.",
      disclaimer: "A matching hash confirms byte preservation.",
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockVerification);

    const result = await verifyEvidenceIntegrity("abc-123");
    expect(apiSpy).toHaveBeenCalledWith("/api/v1/evidence/abc-123/verify", {
      method: "POST",
      timeoutMs: 30000,
    });
    expect(result).toEqual(mockVerification);
  });
});

