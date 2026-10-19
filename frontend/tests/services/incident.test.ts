import { describe, it, expect, vi, beforeEach } from "vitest";
import * as apiClient from "../../src/services/api-client";
import {
  createIncident,
  deleteIncident,
  getIncidentById,
  listIncidents,
  updateIncident,
} from "../../src/services/incident";

describe("incident service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls GET /api/v1/incidents with query parameters", async () => {
    const mockList = {
      items: [
        {
          id: "inc-1",
          title: "Blackmail Case 1",
          description: "Demand received",
          incident_date: "2026-10-16",
          status: "open" as const,
          evidence_count: 2,
          created_at: "2026-10-18T10:00:00Z",
          updated_at: "2026-10-18T10:00:00Z",
        },
      ],
      total: 1,
      limit: 10,
      offset: 0,
    };

    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockList);

    const result = await listIncidents({ limit: 10, offset: 0, status: "open", search: "case" });
    expect(apiSpy).toHaveBeenCalledTimes(1);
    const [path, options] = apiSpy.mock.calls[0];
    expect(path).toBe("/api/v1/incidents?limit=10&offset=0&status=open&search=case");
    expect(options?.method).toBe("GET");
    expect(result).toEqual(mockList);
  });

  it("calls POST /api/v1/incidents with JSON payload", async () => {
    const mockCreated = {
      id: "inc-new",
      title: "Extortion Attempt",
      description: "Demands made via chat",
      incident_date: "2026-10-15",
      status: "open" as const,
      evidence_count: 1,
      created_at: "2026-10-18T10:10:00Z",
      updated_at: "2026-10-18T10:10:00Z",
      linked_evidence: [],
    };

    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockCreated);

    const payload = {
      title: "Extortion Attempt",
      description: "Demands made via chat",
      incident_date: "2026-10-15",
      status: "open" as const,
      evidence_ids: ["ev-123"],
    };

    const result = await createIncident(payload);
    expect(apiSpy).toHaveBeenCalledTimes(1);
    const [path, options] = apiSpy.mock.calls[0];
    expect(path).toBe("/api/v1/incidents");
    expect(options?.method).toBe("POST");
    expect(options?.body).toBe(JSON.stringify(payload));
    expect(result).toEqual(mockCreated);
  });

  it("calls GET /api/v1/incidents/{id} for getIncidentById", async () => {
    const mockDetail = {
      id: "inc-xyz",
      title: "Threat Note",
      description: null,
      incident_date: null,
      status: "documented" as const,
      evidence_count: 0,
      created_at: "2026-10-18T10:20:00Z",
      updated_at: "2026-10-18T10:20:00Z",
      linked_evidence: [],
    };

    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockDetail);

    const result = await getIncidentById("inc-xyz");
    expect(apiSpy).toHaveBeenCalledWith("/api/v1/incidents/inc-xyz", { method: "GET" });
    expect(result).toEqual(mockDetail);
  });

  it("calls PATCH /api/v1/incidents/{id} with update payload", async () => {
    const mockUpdated = {
      id: "inc-xyz",
      title: "Updated Threat Note",
      description: "Added details",
      incident_date: "2026-10-17",
      status: "resolved" as const,
      evidence_count: 0,
      created_at: "2026-10-18T10:20:00Z",
      updated_at: "2026-10-18T10:25:00Z",
      linked_evidence: [],
    };

    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockUpdated);

    const result = await updateIncident("inc-xyz", {
      title: "Updated Threat Note",
      status: "resolved",
    });

    const [path, options] = apiSpy.mock.calls[0];
    expect(path).toBe("/api/v1/incidents/inc-xyz");
    expect(options?.method).toBe("PATCH");
    expect(result).toEqual(mockUpdated);
  });

  it("calls DELETE /api/v1/incidents/{id} for deleteIncident", async () => {
    const mockDelete = {
      id: "inc-del",
      deleted: true,
      message: "Deleted successfully",
    };

    const apiSpy = vi.spyOn(apiClient, "apiRequest").mockResolvedValueOnce(mockDelete);

    const result = await deleteIncident("inc-del");
    expect(apiSpy).toHaveBeenCalledWith("/api/v1/incidents/inc-del", { method: "DELETE" });
    expect(result).toEqual(mockDelete);
  });
});
