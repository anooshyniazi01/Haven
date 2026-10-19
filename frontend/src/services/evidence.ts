/**
 * Evidence API service for Evidence Vault operations.
 * Conforms to docs/API_SPEC.md Section 8 and docs/EVIDENCE_HANDLING.md.
 */

import { apiRequest } from "./api-client";
import {
  EvidenceDetailResponse,
  EvidenceItem,
  EvidenceListResponse,
  EvidenceVerificationResponse,
} from "../types/evidence";

export interface ListEvidenceParams {
  limit?: number;
  offset?: number;
  search?: string;
  hasAnalysis?: boolean;
}

/**
 * Upload an image file directly to the Evidence Vault and compute its SHA-256 hash.
 */
export async function uploadEvidence(
  file: File,
  description?: string
): Promise<EvidenceItem> {
  const formData = new FormData();
  formData.append("file", file);
  if (description && description.trim()) {
    formData.append("description", description.trim());
  }

  return apiRequest<EvidenceItem>("/api/v1/evidence", {
    method: "POST",
    body: formData,
    timeoutMs: 60000,
  });
}

/**
 * List preserved evidence records with pagination and optional search filter.
 */
export async function listEvidence(
  params: ListEvidenceParams = {}
): Promise<EvidenceListResponse> {
  const { limit = 20, offset = 0, search, hasAnalysis } = params;
  const searchParams = new URLSearchParams();

  searchParams.append("limit", String(limit));
  searchParams.append("offset", String(offset));

  if (search && search.trim()) {
    searchParams.append("search", search.trim());
  }

  if (hasAnalysis !== undefined) {
    searchParams.append("has_analysis", String(hasAnalysis));
  }

  return apiRequest<EvidenceListResponse>(`/api/v1/evidence?${searchParams.toString()}`);
}

/**
 * Retrieve comprehensive details and linked report summary for a specific evidence item.
 */
export async function getEvidenceById(
  evidenceId: string
): Promise<EvidenceDetailResponse> {
  return apiRequest<EvidenceDetailResponse>(
    `/api/v1/evidence/${encodeURIComponent(evidenceId)}`
  );
}

/**
 * Trigger real-time cryptographic verification of the physical stored file against its baseline SHA-256 hash.
 */
export async function verifyEvidenceIntegrity(
  evidenceId: string
): Promise<EvidenceVerificationResponse> {
  return apiRequest<EvidenceVerificationResponse>(
    `/api/v1/evidence/${encodeURIComponent(evidenceId)}/verify`,
    {
      method: "POST",
      timeoutMs: 30000,
    }
  );
}
