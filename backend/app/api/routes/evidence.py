"""Evidence API routes for upload, cryptographic hashing, and vault records.
Conforms to docs/API_SPEC.md Section 8 and docs/EVIDENCE_HANDLING.md.
"""

from datetime import datetime, timezone
import hashlib
import json
import os
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.core.errors import DatabaseError, ResourceNotFoundError
from app.core.logging import get_logger
from app.db.models.analysis import Analysis
from app.db.models.evidence import Evidence
from app.db.session import get_db
from app.schemas.evidence import (
    EvidenceAnalysisSummary,
    EvidenceDetailResponse,
    EvidenceListResponse,
    EvidenceResponse,
    EvidenceVerificationResponse,
)
from app.services.storage import (
    cleanup_stored_file,
    get_absolute_path,
    process_and_store_upload,
)

logger = get_logger("routes.evidence")

router = APIRouter(prefix="/evidence", tags=["evidence"])


def build_evidence_response(evidence: Evidence) -> EvidenceResponse:
    """Helper to convert an Evidence ORM model into EvidenceResponse with analysis status."""
    has_analysis = False
    analysis_status = None
    if evidence.analysis_id and evidence.analysis:
        analysis_status = evidence.analysis.status
        has_analysis = evidence.analysis.status == "completed"

    return EvidenceResponse(
        id=evidence.id,
        original_filename=evidence.original_filename,
        file_size_bytes=evidence.file_size_bytes,
        mime_type_detected=evidence.mime_type_detected,
        sha256=evidence.sha256,
        description=evidence.description,
        created_at=evidence.created_at,
        analysis_id=evidence.analysis_id,
        has_analysis=has_analysis,
        analysis_status=analysis_status,
    )


@router.post(
    "",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image evidence and record cryptographic hash",
    description="Validates image content, stores file securely, computes SHA-256 digest, and persists metadata.",
)
async def upload_evidence(
    file: UploadFile = File(..., description="Image file to upload (JPEG, PNG, WEBP; max 25MB)"),
    description: Optional[str] = Form(None, description="Optional description of the evidence item"),
    db: Session = Depends(get_db),
) -> EvidenceResponse:
    """Securely upload an evidence image, calculate its SHA-256 hash, and record in SQLite."""
    # Step 1: Stream and validate uploaded file bytes
    stored_meta = await process_and_store_upload(
        upload_stream=file,
        original_filename=file.filename,
    )

    # Step 2: Persist metadata in database with atomic rollback on failure
    try:
        clean_description = description.strip() if description else None
        evidence_record = Evidence(
            original_filename=stored_meta.original_filename,
            storage_key=stored_meta.storage_key,
            file_size_bytes=stored_meta.file_size_bytes,
            mime_type_detected=stored_meta.mime_type_detected,
            sha256=stored_meta.sha256,
            description=clean_description,
        )
        db.add(evidence_record)
        db.commit()
        db.refresh(evidence_record)

        logger.info(
            "Evidence record created: id=%s, sha256=%s",
            evidence_record.id,
            evidence_record.sha256,
        )
        return build_evidence_response(evidence_record)

    except Exception as exc:
        db.rollback()
        # Clean up stored file to avoid orphaned artifacts
        cleanup_stored_file(stored_meta.storage_key)
        logger.error("Failed to persist evidence record in database: %s", str(exc), exc_info=True)
        raise DatabaseError("Failed to persist evidence record to the database.") from exc


@router.get(
    "",
    response_model=EvidenceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List evidence items in the Evidence Vault",
    description="Returns a paginated list of preserved evidence records with cryptographic hashes and analysis status.",
)
def list_evidence(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of evidence items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    search: Optional[str] = Query(None, description="Search filter for original filename or user description"),
    has_analysis: Optional[bool] = Query(None, description="Filter items by whether technical inspection is completed"),
    db: Session = Depends(get_db),
) -> EvidenceListResponse:
    """List preserved evidence items from the database with pagination and search filtering."""
    query = db.query(Evidence)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Evidence.original_filename.ilike(term),
                Evidence.description.ilike(term),
                Evidence.id.ilike(term),
            )
        )

    if has_analysis is not None:
        if has_analysis:
            query = query.join(Evidence.analysis).filter(Analysis.status == "completed")
        else:
            query = query.outerjoin(Evidence.analysis).filter(
                or_(
                    Evidence.analysis_id.is_(None),
                    Analysis.status != "completed",
                )
            )

    total = query.count()
    records = query.order_by(desc(Evidence.created_at)).offset(offset).limit(limit).all()

    items = [build_evidence_response(ev) for ev in records]

    return EvidenceListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{evidence_id}",
    response_model=EvidenceDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve evidence record by ID",
    description="Retrieves persisted evidence metadata, physical file presence, and associated inspection summary.",
)
def get_evidence_by_id(
    evidence_id: str,
    db: Session = Depends(get_db),
) -> EvidenceDetailResponse:
    """Retrieve an evidence record from the Evidence Vault by UUID."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise ResourceNotFoundError(f"Evidence item '{evidence_id}' was not found.")

    abs_path = get_absolute_path(evidence.storage_key)
    file_exists = os.path.exists(abs_path)

    has_analysis = False
    analysis_status = None
    analysis_summary = None

    if evidence.analysis_id and evidence.analysis:
        an = evidence.analysis
        analysis_status = an.status
        has_analysis = an.status == "completed"

        limitations = []
        if an.limitations_json:
            try:
                limitations = json.loads(an.limitations_json)
            except Exception:
                limitations = []

        analysis_summary = EvidenceAnalysisSummary(
            id=an.id,
            status=an.status,
            analysis_method=an.analysis_method,
            result_label=an.result_label,
            completed_at=an.completed_at,
            explanation=an.explanation,
            limitations=limitations,
        )

    return EvidenceDetailResponse(
        id=evidence.id,
        original_filename=evidence.original_filename,
        file_size_bytes=evidence.file_size_bytes,
        mime_type_detected=evidence.mime_type_detected,
        sha256=evidence.sha256,
        description=evidence.description,
        created_at=evidence.created_at,
        analysis_id=evidence.analysis_id,
        has_analysis=has_analysis,
        analysis_status=analysis_status,
        file_exists=file_exists,
        analysis_summary=analysis_summary,
    )


@router.post(
    "/{evidence_id}/verify",
    response_model=EvidenceVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify cryptographic integrity of stored evidence file",
    description="Recomputes SHA-256 hash from physical storage bytes and compares against recorded baseline hash.",
)
def verify_evidence_integrity(
    evidence_id: str,
    db: Session = Depends(get_db),
) -> EvidenceVerificationResponse:
    """Recomputes SHA-256 hash of preserved file and verifies byte integrity against recorded baseline."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise ResourceNotFoundError(f"Evidence item '{evidence_id}' was not found.")

    abs_path = get_absolute_path(evidence.storage_key)
    now = datetime.now(timezone.utc)

    if not os.path.exists(abs_path):
        return EvidenceVerificationResponse(
            evidence_id=evidence.id,
            status="unavailable",
            recorded_sha256=evidence.sha256,
            computed_sha256=None,
            verified_at=now,
            message="Evidence file could not be found in local vault storage.",
        )

    try:
        hasher = hashlib.sha256()
        with open(abs_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        computed_hash = hasher.hexdigest().lower()
    except Exception as exc:
        logger.error("Error reading stored evidence file %s: %s", evidence.id, str(exc), exc_info=True)
        return EvidenceVerificationResponse(
            evidence_id=evidence.id,
            status="unavailable",
            recorded_sha256=evidence.sha256,
            computed_sha256=None,
            verified_at=now,
            message="Failed to read stored evidence bytes for cryptographic verification.",
        )

    is_match = computed_hash == evidence.sha256.lower()

    if is_match:
        msg = "The cryptographic SHA-256 hash of the stored file exactly matches the recorded baseline hash. File bytes have remained unchanged since intake."
        ver_status = "match"
    else:
        msg = "Integrity mismatch detected. The currently stored file bytes differ from the baseline SHA-256 hash recorded at intake."
        ver_status = "mismatch"

    return EvidenceVerificationResponse(
        evidence_id=evidence.id,
        status=ver_status,
        recorded_sha256=evidence.sha256,
        computed_sha256=computed_hash,
        verified_at=now,
        message=msg,
    )


@router.post(
    "/{evidence_id}/analyze",
    status_code=status.HTTP_200_OK,
    summary="Analyze an existing evidence record",
    description="Initiates and completes technical image inspection on an existing evidence item, linking the analysis record.",
)
def analyze_evidence_by_id(
    evidence_id: str,
    db: Session = Depends(get_db),
):
    """Convenience endpoint to immediately run technical inspection on an existing evidence item."""
    from datetime import datetime, timezone
    import json
    import os
    from app.core.errors import AnalysisUnprocessableError
    from app.db.models.analysis import Analysis
    from app.schemas.analysis import AnalysisResponse, AnalysisResult, TechnicalInspectionResult
    from app.services.inspector import inspect_image_file
    from app.services.storage import get_absolute_path

    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise ResourceNotFoundError(f"Evidence item '{evidence_id}' was not found.")

    abs_path = get_absolute_path(evidence.storage_key)
    if not os.path.exists(abs_path):
        raise AnalysisUnprocessableError("Evidence file is missing from local storage.")

    # Check if analysis record already exists for this evidence
    analysis = None
    if evidence.analysis_id:
        analysis = db.query(Analysis).filter(Analysis.id == evidence.analysis_id).first()

    now = datetime.now(timezone.utc)
    if not analysis:
        analysis = Analysis(
            original_filename=evidence.original_filename,
            storage_key=evidence.storage_key,
            file_size_bytes=evidence.file_size_bytes,
            mime_type_detected=evidence.mime_type_detected,
            sha256=evidence.sha256,
            status="processing",
            created_at=now,
        )
        db.add(analysis)
        db.flush()
        evidence.analysis_id = analysis.id

    # Run technical image inspection
    inspection_result = inspect_image_file(
        file_path=abs_path,
        file_size_bytes=evidence.file_size_bytes,
        detected_mime=evidence.mime_type_detected,
    )

    analysis.status = "completed"
    if inspection_result.ai_forensics and inspection_result.ai_forensics.status == "success":
        analysis.analysis_method = "technical_and_ai_synthetic_inspection"
        analysis.model_name = inspection_result.ai_forensics.model_name
        analysis.model_version = inspection_result.ai_forensics.model_version
        analysis.result_score = inspection_result.score
        analysis.score_type = inspection_result.score_type
    else:
        analysis.analysis_method = "technical_image_inspection"
        analysis.model_name = None
        analysis.model_version = None
        analysis.result_score = None
        analysis.score_type = None

    analysis.result_label = inspection_result.label
    analysis.explanation = inspection_result.explanation
    analysis.limitations_json = json.dumps(inspection_result.limitations)

    details_payload = {}
    if inspection_result.technical_inspection:
        details_payload["technical_inspection"] = inspection_result.technical_inspection.model_dump()
    if inspection_result.ai_forensics:
        details_payload["ai_forensics"] = inspection_result.ai_forensics.model_dump()
    analysis.technical_details_json = json.dumps(details_payload)
    analysis.completed_at = now
    analysis.updated_at = now

    db.commit()
    db.refresh(analysis)

    limitations = json.loads(analysis.limitations_json) if analysis.limitations_json else []
    technical_inspection = inspection_result.technical_inspection
    ai_forensics = inspection_result.ai_forensics

    result_payload = AnalysisResult(
        label=analysis.result_label,
        score=analysis.result_score,
        score_type=analysis.score_type,
        explanation=analysis.explanation or "Technical inspection completed.",
        limitations=limitations,
        technical_inspection=technical_inspection,
        ai_forensics=ai_forensics,
    )

    return AnalysisResponse(
        id=analysis.id,
        original_filename=analysis.original_filename,
        file_size_bytes=analysis.file_size_bytes,
        mime_type_detected=analysis.mime_type_detected,
        sha256=analysis.sha256,
        status=analysis.status,
        analysis_method=analysis.analysis_method,
        model_name=analysis.model_name,
        model_version=analysis.model_version,
        result=result_payload,
        error_code=analysis.error_code,
        created_at=analysis.created_at,
        completed_at=analysis.completed_at,
        updated_at=analysis.updated_at,
        evidence_id=evidence.id,
    )
