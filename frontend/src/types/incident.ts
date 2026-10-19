export type IncidentStatus = "open" | "documented" | "resolved";

export interface IncidentLinkedEvidence {
  id: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type_detected: string;
  sha256: string;
  created_at: string;
  linked_at: string;
  file_exists: boolean;
}

export interface IncidentItem {
  id: string;
  title: string;
  description: string | null;
  incident_date: string | null;
  status: IncidentStatus;
  evidence_count: number;
  created_at: string;
  updated_at: string;
}

export interface IncidentDetail extends IncidentItem {
  linked_evidence: IncidentLinkedEvidence[];
}

export interface IncidentListResponse {
  items: IncidentItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface IncidentCreatePayload {
  title: string;
  description?: string | null;
  incident_date?: string | null;
  status?: IncidentStatus;
  evidence_ids?: string[];
}

export interface IncidentUpdatePayload {
  title?: string;
  description?: string | null;
  incident_date?: string | null;
  status?: IncidentStatus;
  evidence_ids?: string[];
}

export interface IncidentDeleteResponse {
  id: string;
  deleted: boolean;
  message: string;
}
