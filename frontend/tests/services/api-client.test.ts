import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest } from "../../src/services/api-client";

describe("api-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully fetches and returns JSON data", async () => {
    const mockData = { status: "ok" };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as unknown as Response);

    const result = await apiRequest<{ status: string }>("/health");
    expect(result).toEqual(mockData);
  });

  it("throws formatted error message on API error response", async () => {
    const errorBody = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Database ping failed",
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => errorBody,
    } as unknown as Response);

    await expect(apiRequest("/api/v1/status")).rejects.toThrow(
      "Database ping failed (HTTP 503)"
    );
  });

  it("handles non-JSON error responses gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as Response);

    await expect(apiRequest("/health")).rejects.toThrow("Request failed with status 502");
  });

  it("propagates network errors with helpful context", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(apiRequest("/health")).rejects.toThrow(
      "Network connection failed: Failed to fetch"
    );
  });
});
