"""Pydantic schemas for health and system status endpoints."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response model for lightweight backend liveness check."""

    status: str = Field(..., description="Liveness status of the backend", examples=["ok"])


class StatusResponse(BaseModel):
    """Response model for comprehensive component readiness status."""

    status: str = Field(
        ...,
        description="Overall application status (e.g., ready or degraded)",
        examples=["ready"],
    )
    database: str = Field(
        ...,
        description="Database connection status (e.g., connected or disconnected)",
        examples=["connected"],
    )
    analysis_engine: str = Field(
        ...,
        description="Media analysis engine readiness status",
        examples=["available"],
    )
