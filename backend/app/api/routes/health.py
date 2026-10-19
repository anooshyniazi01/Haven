"""Health check and application status endpoints conforming to docs/API_SPEC.md."""

from fastapi import APIRouter, status
from app.db.session import check_db_health
from app.schemas.health import HealthResponse, StatusResponse

router = APIRouter(tags=["Health & Status"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Backend liveness check",
    description="Verify that the backend web service is actively running.",
)
async def get_health() -> HealthResponse:
    """Liveness probe: returns status ok without exposing system internals."""
    return HealthResponse(status="ok")


@router.get(
    "/api/v1/status",
    response_model=StatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Application readiness status",
    description="Reports the live operational readiness of the database and analysis engine.",
)
async def get_system_status() -> StatusResponse:
    """Readiness probe: validates actual database connectivity."""
    db_connected = check_db_health()
    db_status = "connected" if db_connected else "disconnected"

    # Analysis engine in Slice 1 foundation: baseline technical inspection pipeline is available
    analysis_engine_status = "available"

    overall_status = "ready" if db_connected else "degraded"

    return StatusResponse(
        status=overall_status,
        database=db_status,
        analysis_engine=analysis_engine_status,
    )
