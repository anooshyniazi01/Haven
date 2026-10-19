"""Pydantic schemas for Analysis endpoints.
Conforms to docs/API_SPEC.md Section 5, 6, 7, docs/AI_SPEC.md, and docs/DATABASE_SCHEMA.md Section 4.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DimensionsInfo(BaseModel):
    """Geometric and pixel dimensions of an analyzed image."""

    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    aspect_ratio: str = Field(..., description="Aspect ratio representation (e.g. 16:9, 4:3, 1:1)")
    total_pixels: int = Field(..., description="Total pixel count (width * height)")
    megapixels: float = Field(..., description="Megapixel estimate rounded to 2 decimal places")


class MetadataSummary(BaseModel):
    """Safely extracted image metadata and EXIF status."""

    has_exif: bool = Field(..., description="Whether readable EXIF metadata was present")
    tags_present: Dict[str, Any] = Field(
        default_factory=dict,
        description="Safe, non-sensitive EXIF tags present (e.g. Camera Make, Model, Software, DateTime)",
    )
    tags_absent: List[str] = Field(
        default_factory=list,
        description="Standard metadata tags absent from file",
    )
    gps_status: str = Field(
        ...,
        description="Status of geolocation data. For privacy safety, raw coordinates are never exposed.",
    )
    note: str = Field(
        ...,
        description="Contextual note clarifying that missing metadata is common on social platforms and is not proof of tampering.",
    )


class AnomalyFinding(BaseModel):
    """Observed technical anomaly or consistency indicator."""

    category: str = Field(..., description="Category of inspection (e.g. format_encoding, dimension_sanity)")
    description: str = Field(..., description="Technical observation description")
    severity: str = Field(..., description="Severity level: 'info', 'warning', or 'inconclusive'")


class TechnicalInspectionResult(BaseModel):
    """Comprehensive technical image inspection properties."""

    dimensions: DimensionsInfo
    format: str = Field(..., description="Decoded image format (JPEG, PNG, WEBP)")
    mime_type: str = Field(..., description="Verified MIME type")
    mode: str = Field(..., description="Color mode (e.g. RGB, RGBA, L, CMYK)")
    color_channels: int = Field(..., description="Number of color channels")
    bit_depth: int = Field(..., description="Estimated bits per channel")
    has_transparency: bool = Field(..., description="Whether alpha channel or transparency is present")
    color_profile_present: bool = Field(..., description="Whether an embedded ICC color profile is present")
    file_size_bytes: int = Field(..., description="File size on disk in bytes")
    compression_ratio: float = Field(..., description="Ratio of raw uncompressed pixel bytes to file size")
    metadata_summary: MetadataSummary
    anomalies: List[AnomalyFinding] = Field(default_factory=list)
    ai_model_status: str = Field(
        ...,
        description="Honest notification regarding AI synthetic/manipulation model availability.",
    )


class AIForensicsResult(BaseModel):
    """Detailed forensic results from AI-generated media detection model."""

    task: str = Field("ai_generated_image_detection", description="Specific forensic detection task")
    model_name: str = Field(..., description="Identity and architecture of model used")
    model_version: str = Field(..., description="Version of model or weights checkpoint")
    status: str = Field(..., description="Execution status: 'success', 'unavailable', 'failed', or 'unsupported_input'")
    raw_score: Optional[float] = Field(None, description="Direct model output probability (0.0 to 1.0) before any thresholding")
    synthetic_likelihood: Optional[float] = Field(None, description="Reported synthetic probability score")
    label: Optional[str] = Field(None, description="Indicator tier: 'elevated_synthetic_indicators', 'inconclusive_synthetic_signals', 'low_synthetic_indicators', etc.")
    evaluation_status: str = Field(..., description="Honest calibration and validation status disclosure")
    inference_latency_ms: Optional[float] = Field(None, description="Local CPU inference latency in milliseconds")
    explanation: Optional[str] = Field(None, description="Forensic explanation of AI model findings")
    limitations: List[str] = Field(default_factory=list, description="Specific limitations regarding generator coverage, recompression, etc.")


class AnalysisResult(BaseModel):
    """Result payload conforming to docs/API_SPEC.md Section 6."""

    label: str = Field(..., description="Forensic/technical inspection result label")
    score: Optional[float] = Field(None, description="Score produced by model, or None if unavailable")
    score_type: Optional[str] = Field(None, description="Meaning and scale of score, or None")
    explanation: str = Field(..., description="Human-readable explanation grounded in actual observations")
    limitations: List[str] = Field(default_factory=list, description="Structured forensic limitations and disclaimers")
    technical_inspection: Optional[TechnicalInspectionResult] = Field(
        None, description="Detailed verifiable technical image measurements"
    )
    ai_forensics: Optional[AIForensicsResult] = Field(
        None, description="AI-assisted synthetic media detection findings and limitations"
    )



class AnalysisCreateRequest(BaseModel):
    """Request payload to initiate analysis for an existing evidence record."""

    evidence_id: Optional[str] = Field(None, description="Existing Evidence UUID to analyze")
    save_to_vault: bool = Field(False, description="Whether to also preserve this upload in the Evidence Vault")


class AnalysisUploadResponse(BaseModel):
    """Response returned upon initial image registration for analysis."""

    id: str = Field(..., description="Unique UUID for the analysis record")
    filename: str = Field(..., description="Display filename of the analyzed image")
    status: str = Field(..., description="Analysis status ('uploaded', 'processing', 'completed', 'failed')")
    created_at: datetime = Field(..., description="Timestamp of analysis registration")
    saved_to_vault: bool = Field(False, description="Whether saved to vault")
    evidence_id: Optional[str] = Field(None, description="Linked evidence ID if applicable")

    model_config = ConfigDict(from_attributes=True)


class AnalysisResponse(BaseModel):
    """Full analysis response returned by run and retrieve endpoints."""

    id: str = Field(..., description="Unique UUID for the analysis record")
    original_filename: str = Field(..., description="Display filename of the uploaded image")
    file_size_bytes: int = Field(..., description="Exact file size in bytes")
    mime_type_detected: str = Field(..., description="Verified MIME type")
    sha256: str = Field(..., description="Cryptographic SHA-256 hash of the exact stored bytes")
    status: str = Field(..., description="Analysis lifecycle status ('uploaded', 'processing', 'completed', 'failed')")
    analysis_method: Optional[str] = Field(None, description="Analysis method executed (e.g. technical_image_inspection)")
    model_name: Optional[str] = Field(None, description="Model identifier if model inference was run")
    model_version: Optional[str] = Field(None, description="Model version if applicable")
    result: Optional[AnalysisResult] = Field(None, description="Analysis result and findings")
    error_code: Optional[str] = Field(None, description="Safe error code if analysis failed")
    created_at: datetime = Field(..., description="Record creation timestamp")
    completed_at: Optional[datetime] = Field(None, description="Analysis completion timestamp")
    updated_at: datetime = Field(..., description="Last updated timestamp")
    evidence_id: Optional[str] = Field(None, description="Associated Evidence Vault record ID if linked")

    model_config = ConfigDict(from_attributes=True)


class AnalysisListItem(BaseModel):
    """Compact summary item for analysis list queries."""

    id: str
    original_filename: str
    status: str
    result_label: Optional[str] = None
    analysis_method: Optional[str] = None
    sha256: str
    file_size_bytes: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisListResponse(BaseModel):
    """Paginated list of saved analyses."""

    items: List[AnalysisListItem]
    total: int
    limit: int
    offset: int
