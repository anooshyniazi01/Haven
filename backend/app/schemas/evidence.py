"""Pydantic schemas for Evidence Vault endpoints.
Conforms to docs/API_SPEC.md Section 8 and docs/DATABASE_SCHEMA.md Section 5.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class EvidenceResponse(BaseModel):
    """Evidence record response schema containing verified cryptographic hash and metadata."""

    id: str = Field(..., description="Unique UUID identifier for the evidence record")
    original_filename: str = Field(..., description="Display filename of the uploaded evidence")
    file_size_bytes: int = Field(..., description="Exact size of the preserved file in bytes")
    mime_type_detected: str = Field(..., description="Server-verified MIME type (e.g. image/jpeg)")
    sha256: str = Field(..., description="Cryptographic SHA-256 hash of the exact stored bytes")
    description: Optional[str] = Field(None, description="Optional user-provided note or description")
    created_at: datetime = Field(..., description="UTC timestamp when evidence was recorded")
    analysis_id: Optional[str] = Field(None, description="Linked analysis ID if applicable")
    has_analysis: bool = Field(False, description="Whether a technical inspection report has been completed")
    analysis_status: Optional[str] = Field(None, description="Lifecycle status of linked analysis (e.g. completed, uploaded)")

    model_config = ConfigDict(from_attributes=True)


class EvidenceAnalysisSummary(BaseModel):
    """Summary of the technical inspection associated with an evidence record."""

    id: str = Field(..., description="Analysis record UUID")
    status: str = Field(..., description="Analysis status: uploaded, processing, completed, or failed")
    analysis_method: Optional[str] = Field(None, description="Method used, e.g. technical_image_inspection")
    result_label: Optional[str] = Field(None, description="Inspection result summary label")
    completed_at: Optional[datetime] = Field(None, description="Timestamp when inspection completed")
    explanation: Optional[str] = Field(None, description="Forensic plain-English observation summary")
    limitations: list[str] = Field(default_factory=list, description="Forensic disclaimers and scope limitations")


class EvidenceDetailResponse(EvidenceResponse):
    """Detailed evidence response containing storage presence verification and linked report summary."""

    file_exists: bool = Field(..., description="Whether the preserved file currently exists in vault storage")
    analysis_summary: Optional[EvidenceAnalysisSummary] = Field(
        None, description="Summary of linked inspection report if available"
    )


class EvidenceListResponse(BaseModel):
    """Paginated list of preserved evidence items in the Evidence Vault."""

    items: list[EvidenceResponse] = Field(..., description="List of evidence items matching query")
    total: int = Field(..., description="Total count of evidence items matching query")
    limit: int = Field(20, description="Maximum number of items returned")
    offset: int = Field(0, description="Number of items skipped")


class EvidenceVerificationResponse(BaseModel):
    """Cryptographic integrity verification result comparing stored bytes against recorded SHA-256."""

    evidence_id: str = Field(..., description="Evidence item UUID verified")
    status: str = Field(..., description="Verification outcome: match, mismatch, or unavailable")
    recorded_sha256: str = Field(..., description="Baseline SHA-256 hash recorded upon intake")
    computed_sha256: Optional[str] = Field(None, description="SHA-256 hash recomputed from currently stored file bytes")
    verified_at: datetime = Field(..., description="UTC timestamp when verification check was executed")
    message: str = Field(..., description="Human-readable outcome description")
    disclaimer: str = Field(
        "A matching SHA-256 hash confirms that the stored file bytes have not changed since intake. "
        "It does not prove that the image is authentic, unedited before upload, or depicts real events.",
        description="Forensic scope limitation note regarding cryptographic hashing",
    )
