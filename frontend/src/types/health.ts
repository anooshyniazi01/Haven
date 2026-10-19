/**
 * TypeScript types for API health and status contracts
 * Conforms strictly to docs/API_SPEC.md Section 3 & 12
 */

export interface HealthResponse {
  status: string;
}

export interface StatusResponse {
  status: "ready" | "degraded" | string;
  database: "connected" | "disconnected" | string;
  analysis_engine: "available" | "unavailable" | string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}
