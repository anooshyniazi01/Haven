/**
 * Health and Readiness API Service
 * Calls actual backend endpoints defined in docs/API_SPEC.md
 */

import { apiRequest } from "./api-client";
import { HealthResponse, StatusResponse } from "../types/health";

export async function checkBackendHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/health");
}

export async function checkSystemStatus(): Promise<StatusResponse> {
  return apiRequest<StatusResponse>("/api/v1/status");
}
