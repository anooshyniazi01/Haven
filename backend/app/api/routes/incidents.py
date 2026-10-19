"""Incident API routes for documenting, updating, listing, and managing blackmail incidents.
Conforms to docs/API_SPEC.md Section 9, docs/DATABASE_SCHEMA.md, and docs/SECURITY.md.
"""

from datetime import datetime, timezone
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import EvidenceNotFoundError, IncidentNotFoundError
from app.core.logging import get_logger
from app.db.models.evidence import Evidence
from app.db.models.incident import Incident
from app.db.models.incident_evidence import IncidentEvidence
from app.db.session import get_db
from app.schemas.incident import (
    IncidentCreateRequest,
    IncidentDeleteResponse,
    IncidentDetailResponse,
    IncidentLinkedEvidence,
    IncidentListResponse,
    IncidentResponse,
    IncidentUpdateRequest,
)
from app.services.storage import get_absolute_path

logger = get_logger("routes.incidents")

router = APIRouter(prefix="/incidents", tags=["incidents"])


def _build_incident_detail(incident: Incident) -> IncidentDetailResponse:
    """Helper to convert an Incident ORM model into IncidentDetailResponse with safe storage checks."""
    linked_evidence_items = []
    for link in incident.evidence_links:
        ev = link.evidence
        if not ev:
            continue
        abs_path = get_absolute_path(ev.storage_key)
        file_exists = os.path.exists(abs_path)

        linked_evidence_items.append(
            IncidentLinkedEvidence(
                id=ev.id,
                original_filename=ev.original_filename,
                file_size_bytes=ev.file_size_bytes,
                mime_type_detected=ev.mime_type_detected,
                sha256=ev.sha256,
                created_at=ev.created_at,
                linked_at=link.linked_at,
                file_exists=file_exists,
            )
        )

    # Sort linked evidence items chronologically by when they were linked
    linked_evidence_items.sort(key=lambda x: x.linked_at)

    return IncidentDetailResponse(
        id=incident.id,
        title=incident.title,
        description=incident.description,
        incident_date=incident.incident_date,
        status=incident.status,
        evidence_count=len(linked_evidence_items),
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        linked_evidence=linked_evidence_items,
    )


@router.get(
    "",
    response_model=IncidentListResponse,
    status_code=status.HTTP_200_OK,
    summary="List saved incident records",
    description="Returns a paginated list of documented incidents with evidence counts and optional status/search filters.",
)
def list_incidents(
    limit: int = Query(default=10, ge=1, le=100, description="Max records to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    incident_status: Optional[str] = Query(None, alias="status", description="Filter by status (open, documented, resolved)"),
    search: Optional[str] = Query(None, description="Search term for title or description"),
    db: Session = Depends(get_db),
) -> IncidentListResponse:
    """List persisted incident records without N+1 query overhead."""
    # Correlated subquery for counting associated evidence
    evidence_count_subq = (
        select(func.count(IncidentEvidence.evidence_id))
        .where(IncidentEvidence.incident_id == Incident.id)
        .scalar_subquery()
    )

    query = select(Incident, evidence_count_subq.label("evidence_count"))
    count_query = select(func.count()).select_from(Incident)

    if incident_status:
        valid_statuses = {"open", "documented", "resolved"}
        if incident_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status '{incident_status}'. Allowed statuses: {', '.join(sorted(valid_statuses))}",
            )
        query = query.where(Incident.status == incident_status)
        count_query = count_query.where(Incident.status == incident_status)

    if search and search.strip():
        term = f"%{search.strip()}%"
        search_filter = or_(
            Incident.title.ilike(term),
            Incident.description.ilike(term),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = db.scalar(count_query) or 0
    rows = db.execute(query.order_by(Incident.created_at.desc()).offset(offset).limit(limit)).all()

    items = [
        IncidentResponse(
            id=inc.id,
            title=inc.title,
            description=inc.description,
            incident_date=inc.incident_date,
            status=inc.status,
            evidence_count=ev_count or 0,
            created_at=inc.created_at,
            updated_at=inc.updated_at,
        )
        for inc, ev_count in rows
    ]

    return IncidentListResponse(items=items, total=total, limit=limit, offset=offset)


@router.post(
    "",
    response_model=IncidentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new incident record",
    description="Validates and persists an incident record and associates any provided evidence IDs atomically.",
)
def create_incident(
    payload: IncidentCreateRequest,
    db: Session = Depends(get_db),
) -> IncidentDetailResponse:
    """Create an incident record and link specified evidence items."""
    clean_title = payload.title.strip()
    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Incident title cannot be blank.",
        )

    # Validate that all requested evidence_ids exist in the database
    if payload.evidence_ids:
        unique_eids = list(dict.fromkeys(payload.evidence_ids))
        existing_eids = db.scalars(
            select(Evidence.id).where(Evidence.id.in_(unique_eids))
        ).all()
        missing = set(unique_eids) - set(existing_eids)
        if missing:
            logger.warning("Attempted to link nonexistent evidence IDs: %s", missing)
            raise EvidenceNotFoundError(
                f"One or more evidence records could not be found: {', '.join(sorted(missing))}"
            )
    else:
        unique_eids = []

    clean_desc = payload.description.strip() if payload.description else None

    incident = Incident(
        title=clean_title,
        description=clean_desc,
        incident_date=payload.incident_date,
        status=payload.status,
    )
    db.add(incident)
    db.flush()

    for eid in unique_eids:
        link = IncidentEvidence(incident_id=incident.id, evidence_id=eid)
        db.add(link)

    db.commit()

    # Reload with relationships
    stmt = (
        select(Incident)
        .options(
            selectinload(Incident.evidence_links).selectinload(IncidentEvidence.evidence)
        )
        .where(Incident.id == incident.id)
    )
    loaded = db.scalar(stmt)
    logger.info("Successfully created incident %s (evidence count: %d)", incident.id, len(unique_eids))
    return _build_incident_detail(loaded)


@router.get(
    "/{incident_id}",
    response_model=IncidentDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve incident details",
    description="Returns detailed metadata for an incident, its status, and all linked evidence items.",
)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
) -> IncidentDetailResponse:
    """Retrieve full incident details with linked evidence."""
    stmt = (
        select(Incident)
        .options(
            selectinload(Incident.evidence_links).selectinload(IncidentEvidence.evidence)
        )
        .where(Incident.id == incident_id)
    )
    incident = db.scalar(stmt)
    if not incident:
        raise IncidentNotFoundError(f"Incident with ID '{incident_id}' was not found.")

    return _build_incident_detail(incident)


@router.patch(
    "/{incident_id}",
    response_model=IncidentDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Update editable incident fields",
    description="Partially updates an incident record and synchronizes its evidence associations.",
)
def update_incident(
    incident_id: str,
    payload: IncidentUpdateRequest,
    db: Session = Depends(get_db),
) -> IncidentDetailResponse:
    """Partially update an incident and synchronize evidence relationships."""
    stmt = (
        select(Incident)
        .options(
            selectinload(Incident.evidence_links).selectinload(IncidentEvidence.evidence)
        )
        .where(Incident.id == incident_id)
    )
    incident = db.scalar(stmt)
    if not incident:
        raise IncidentNotFoundError(f"Incident with ID '{incident_id}' was not found.")

    provided_fields = payload.model_dump(exclude_unset=True)
    if not provided_fields:
        return _build_incident_detail(incident)

    if "title" in provided_fields:
        if payload.title is None or not payload.title.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Incident title cannot be blank.",
            )
        incident.title = payload.title.strip()

    if "description" in provided_fields:
        incident.description = payload.description.strip() if payload.description else None

    if "incident_date" in provided_fields:
        incident.incident_date = payload.incident_date

    if "status" in provided_fields:
        incident.status = payload.status

    if "evidence_ids" in provided_fields:
        target_eids = list(dict.fromkeys(payload.evidence_ids or []))
        if target_eids:
            existing_eids = db.scalars(
                select(Evidence.id).where(Evidence.id.in_(target_eids))
            ).all()
            missing = set(target_eids) - set(existing_eids)
            if missing:
                raise EvidenceNotFoundError(
                    f"One or more evidence records could not be found: {', '.join(sorted(missing))}"
                )

        current_link_map = {link.evidence_id: link for link in incident.evidence_links}
        current_set = set(current_link_map.keys())
        target_set = set(target_eids)

        # Remove deleted links
        for eid in (current_set - target_set):
            db.delete(current_link_map[eid])

        # Add new links
        for eid in (target_set - current_set):
            db.add(IncidentEvidence(incident_id=incident.id, evidence_id=eid))

    incident.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Reload with updated relationships
    reloaded = db.scalar(stmt)
    logger.info("Updated incident %s", incident_id)
    return _build_incident_detail(reloaded)


@router.delete(
    "/{incident_id}",
    response_model=IncidentDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete an incident record",
    description="Deletes an incident record and its association links only. NEVER deletes preserved evidence files or records.",
)
def delete_incident(
    incident_id: str,
    db: Session = Depends(get_db),
) -> IncidentDeleteResponse:
    """Safely delete an incident and its incident_evidence associations, preserving all evidence intact."""
    incident = db.scalar(select(Incident).where(Incident.id == incident_id))
    if not incident:
        raise IncidentNotFoundError(f"Incident with ID '{incident_id}' was not found.")

    db.delete(incident)
    db.commit()

    logger.info("Deleted incident %s and its associations. Preserved evidence untouched.", incident_id)
    return IncidentDeleteResponse(
        id=incident_id,
        deleted=True,
        message="Incident record and associations successfully deleted. Preserved evidence files remain in the Evidence Vault.",
    )
