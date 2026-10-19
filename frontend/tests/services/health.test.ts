import { describe, it, expect, vi, beforeEach } from "vitest";
import * as apiClient from "../../src/services/api-client";
import { checkBackendHealth, checkSystemStatus } from "../../src/services/health";

describe("health service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls /health for checkBackendHealth", async () => {
    const mockHealth = { status: "ok" };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockHealth);

    const result = await checkBackendHealth();
    expect(apiSpy).toHaveBeenCalledWith("/health");
    expect(result).toEqual(mockHealth);
  });

  it("calls /api/v1/status for checkSystemStatus", async () => {
    const mockStatus = {
      status: "ready",
      database: "connected",
      analysis_engine: "available",
    };
    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockStatus);

    const result = await checkSystemStatus();
    expect(apiSpy).toHaveBeenCalledWith("/api/v1/status");
    expect(result).toEqual(mockStatus);
  });
});
