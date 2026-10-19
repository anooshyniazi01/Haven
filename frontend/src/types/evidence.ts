/**
 * TypeScript types for Evidence Vault contracts.
 * Conforms to docs/API_SPEC.md Section 8 and docs/DATABASE_SCHEMA.md.
 */

export interface EvidenceItem {
  id: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type_detected: string;
  sha256: string;
  description: string | null;
  created_at: string;
  analysis_id?: string | null;
  has_analysis?: boolean;
  analysis_status?: string | null;
}

export interface EvidenceAnalysisSummary {
  id: string;
  status: string;
  analysis_method: string | null;
  result_label: string | null;
  completed_at: string | null;
  explanation: string | null;
  limitations: string[];
}

export interface EvidenceDetailResponse extends EvidenceItem {
  file_exists: boolean;
  analysis_summary: EvidenceAnalysisSummary | null;
}

export interface EvidenceListResponse {
  items: EvidenceItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface EvidenceVerificationResponse {
  evidence_id: string;
  status: "match" | "mismatch" | "unavailable";
  recorded_sha256: string;
  computed_sha256: string | null;
  verified_at: string;
  message: string;
  disclaimer: string;
}
