/**
 * Incident API service for Incident Tracker operations.
 * Conforms to docs/API_SPEC.md Section 9 and docs/DATABASE_SCHEMA.md.
 */

import { apiRequest } from "./api-client";
import {
  IncidentCreatePayload,
  IncidentDeleteResponse,
  IncidentDetail,
  IncidentListResponse,
  IncidentStatus,
  IncidentUpdatePayload,
} from "../types/incident";

export interface ListIncidentsParams {
  limit?: number;
  offset?: number;
  status?: IncidentStatus;
  search?: string;
}

/**
 * List persisted incident records with pagination, status filter, and keyword search.
 */
export async function listIncidents(
  params: ListIncidentsParams = {}
): Promise<IncidentListResponse> {
  const { limit = 10, offset = 0, status, search } = params;
  const searchParams = new URLSearchParams();

  searchParams.append("limit", String(limit));
  searchParams.append("offset", String(offset));

  if (status) {
    searchParams.append("status", status);
  }

  if (search && search.trim()) {
    searchParams.append("search", search.trim());
  }

  const query = searchParams.toString();
  const endpoint = `/api/v1/incidents${query ? `?${query}` : ""}`;

  return apiRequest<IncidentListResponse>(endpoint, {
    method: "GET",
  });
}

/**
 * Retrieve a single incident by ID including its linked evidence details.
 */
export async function getIncidentById(incidentId: string): Promise<IncidentDetail> {
  return apiRequest<IncidentDetail>(`/api/v1/incidents/${encodeURIComponent(incidentId)}`, {
    method: "GET",
  });
}

/**
 * Create a new incident record and optionally associate existing evidence items.
 */
export async function createIncident(
  payload: IncidentCreatePayload
): Promise<IncidentDetail> {
  return apiRequest<IncidentDetail>("/api/v1/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Update editable fields of an existing incident and sync evidence links.
 */
export async function updateIncident(
  incidentId: string,
  payload: IncidentUpdatePayload
): Promise<IncidentDetail> {
  return apiRequest<IncidentDetail>(`/api/v1/incidents/${encodeURIComponent(incidentId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Safely delete an incident and its links, keeping preserved evidence files intact.
 */
export async function deleteIncident(
  incidentId: string
): Promise<IncidentDeleteResponse> {
  return apiRequest<IncidentDeleteResponse>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}`,
    {
      method: "DELETE",
    }
  );
}
