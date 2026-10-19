"""Pydantic schemas for Incident Tracker conforming to docs/API_SPEC.md and docs/DATABASE_SCHEMA.md."""

from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

IncidentStatus = Literal["open", "documented", "resolved"]


class IncidentLinkedEvidence(BaseModel):
    """Metadata for an evidence item linked to an incident."""

    id: str
    original_filename: str
    file_size_bytes: int
    mime_type_detected: str
    sha256: str
    created_at: datetime
    linked_at: datetime
    file_exists: bool = True

    model_config = ConfigDict(from_attributes=True)


class IncidentCreateRequest(BaseModel):
    """Payload for creating a new incident."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Short user-provided label for the incident",
    )
    description: Optional[str] = Field(
        None,
        max_length=10000,
        description="Optional user notes or description of the incident",
    )
    incident_date: Optional[date] = Field(
        None,
        description="User-reported date on which the incident occurred (YYYY-MM-DD)",
    )
    status: IncidentStatus = Field(
        default="open",
        description="Incident tracking status: open, documented, or resolved",
    )
    evidence_ids: List[str] = Field(
        default_factory=list,
        description="List of existing evidence UUIDs to associate with this incident",
    )


class IncidentUpdateRequest(BaseModel):
    """Payload for partially updating an existing incident."""

    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Updated incident title",
    )
    description: Optional[str] = Field(
        None,
        max_length=10000,
        description="Updated incident notes",
    )
    incident_date: Optional[date] = Field(
        None,
        description="Updated reported date of occurrence",
    )
    status: Optional[IncidentStatus] = Field(
        None,
        description="Updated incident tracking status",
    )
    evidence_ids: Optional[List[str]] = Field(
        None,
        description="Updated list of associated evidence UUIDs",
    )


class IncidentResponse(BaseModel):
    """Summary representation of an incident in listing responses."""

    id: str
    title: str
    description: Optional[str] = None
    incident_date: Optional[date] = None
    status: str
    evidence_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentDetailResponse(BaseModel):
    """Detailed representation of an incident including linked evidence references."""

    id: str
    title: str
    description: Optional[str] = None
    incident_date: Optional[date] = None
    status: str
    evidence_count: int = 0
    created_at: datetime
    updated_at: datetime
    linked_evidence: List[IncidentLinkedEvidence] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class IncidentListResponse(BaseModel):
    """Paginated list of incident records."""

    items: List[IncidentResponse]
    total: int
    limit: int
    offset: int


class IncidentDeleteResponse(BaseModel):
    """Response returned upon successful deletion of an incident record."""

    id: str
    deleted: bool = True
    message: str
