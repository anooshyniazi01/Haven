/**
 * TypeScript type definitions for Analysis records and Technical Inspection findings.
 * Conforms to docs/API_SPEC.md Section 5, 6, 7 and docs/AI_SPEC.md.
 */

export interface DimensionsInfo {
  width: number;
  height: number;
  aspect_ratio: string;
  total_pixels: number;
  megapixels: number;
}

export interface MetadataSummary {
  has_exif: boolean;
  tags_present: Record<string, string>;
  tags_absent: string[];
  gps_status: string;
  note: string;
}

export interface AnomalyFinding {
  category: string;
  description: string;
  severity: "info" | "warning" | "inconclusive";
}

export interface TechnicalInspectionResult {
  dimensions: DimensionsInfo;
  format: string;
  mime_type: string;
  mode: string;
  color_channels: number;
  bit_depth: number;
  has_transparency: boolean;
  color_profile_present: boolean;
  file_size_bytes: number;
  compression_ratio: number;
  metadata_summary: MetadataSummary;
  anomalies: AnomalyFinding[];
  ai_model_status: string;
}

export interface AIForensicsResult {
  task?: string;
  model_name: string;
  model_version: string;
  model_available?: boolean;
  inference_status?: "success" | "unavailable" | "failed" | "unsupported_input";
  status: "success" | "unavailable" | "failed" | "unsupported_input";
  raw_score?: number | null;
  synthetic_likelihood: number | null;
  score_semantics: string;
  label?:
    | "elevated_synthetic_indicators"
    | "inconclusive_synthetic_signals"
    | "low_synthetic_indicators"
    | "unsupported_input"
    | "model_unavailable"
    | "inference_failed"
    | null;
  indicator?:
    | "elevated_synthetic_indicators"
    | "inconclusive_synthetic_signals"
    | "low_synthetic_indicators"
    | "elevated_synthetic_signal"
    | "low_synthetic_signal"
    | "inconclusive"
    | "evaluation_pending"
    | "unsupported_input"
    | "model_unavailable"
    | "inference_failed"
    | null;
  inference_latency_ms?: number | null;
  latency_ms?: number | null;
  explanation?: string | null;
  limitations: string[];
  evaluation_status?: string;
  error_message?: string | null;
}

export interface AnalysisResult {
  label: string;
  score: number | null;
  score_type: string | null;
  explanation: string;
  limitations: string[];
  technical_inspection?: TechnicalInspectionResult | null;
  ai_forensics?: AIForensicsResult | null;
}

export interface AnalysisUploadResponse {
  id: string;
  filename: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  created_at: string;
  saved_to_vault: boolean;
  evidence_id?: string | null;
}

export interface AnalysisResponse {
  id: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type_detected: string;
  sha256: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  analysis_method?: string | null;
  model_name?: string | null;
  model_version?: string | null;
  result?: AnalysisResult | null;
  error_code?: string | null;
  created_at: string;
  completed_at?: string | null;
  updated_at: string;
  evidence_id?: string | null;
}

export interface AnalysisListItem {
  id: string;
  original_filename: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  result_label?: string | null;
  analysis_method?: string | null;
  sha256: string;
  file_size_bytes: number;
  created_at: string;
  completed_at?: string | null;
}

export interface AnalysisListResponse {
  items: AnalysisListItem[];
  total: number;
  limit: number;
  offset: number;
}
