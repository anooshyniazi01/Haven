/**
 * Analysis API client service for technical inspection and report retrieval.
 * Conforms to docs/API_SPEC.md Section 5, 6, 7 and docs/AI_SPEC.md.
 */

import { apiBlobRequest, apiRequest } from "./api-client";
import {
  AnalysisListResponse,
  AnalysisResponse,
  AnalysisUploadResponse,
} from "../types/analysis";

/**
 * Register an image file for analysis via multipart form upload.
 */
export async function createAnalysisFromUpload(
  file: File,
  saveToVault: boolean = false
): Promise<AnalysisUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("save_to_vault", String(saveToVault));

  return apiRequest<AnalysisUploadResponse>("/api/v1/analyses", {
    method: "POST",
    body: formData,
    timeoutMs: 60000,
  });
}

/**
 * Register an analysis referencing an existing Evidence Vault item.
 */
export async function createAnalysisFromEvidence(
  evidenceId: string
): Promise<AnalysisUploadResponse> {
  const formData = new FormData();
  formData.append("evidence_id", evidenceId.trim());

  return apiRequest<AnalysisUploadResponse>("/api/v1/analyses", {
    method: "POST",
    body: formData,
    timeoutMs: 30000,
  });
}

/**
 * Run the technical inspection pipeline on an uploaded/registered image.
 */
export async function runAnalysis(
  analysisId: string
): Promise<AnalysisResponse> {
  return apiRequest<AnalysisResponse>(
    `/api/v1/analyses/${encodeURIComponent(analysisId)}/run`,
    {
      method: "POST",
      timeoutMs: 60000,
    }
  );
}

/**
 * Retrieve a persisted analysis report by ID.
 */
export async function getAnalysisById(
  analysisId: string
): Promise<AnalysisResponse> {
  return apiRequest<AnalysisResponse>(
    `/api/v1/analyses/${encodeURIComponent(analysisId)}`
  );
}

/**
 * List saved analysis records with pagination.
 */
export async function listAnalyses(
  limit: number = 20,
  offset: number = 0
): Promise<AnalysisListResponse> {
  return apiRequest<AnalysisListResponse>(
    `/api/v1/analyses?limit=${limit}&offset=${offset}`
  );
}

/**
 * Convenience method to immediately run technical inspection on an existing evidence item in one operation.
 */
export async function analyzeEvidence(
  evidenceId: string
): Promise<AnalysisResponse> {
  return apiRequest<AnalysisResponse>(
    `/api/v1/evidence/${encodeURIComponent(evidenceId)}/analyze`,
    {
      method: "POST",
      timeoutMs: 60000,
    }
  );
}

/**
 * Export a completed technical image inspection report as a PDF Blob.
 * Conforms to docs/API_SPEC.md Section 7.
 */
export async function exportAnalysisPdf(
  analysisId: string
): Promise<Blob> {
  return apiBlobRequest(
    `/api/v1/analyses/${encodeURIComponent(analysisId)}/export`,
    {
      method: "GET",
      timeoutMs: 30000,
    }
  );
}
