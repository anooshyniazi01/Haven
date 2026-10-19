"""Analysis API routes for technical image inspection, lifecycle tracking, and report retrieval.
Conforms to docs/API_SPEC.md Section 5, 6, 7 and docs/AI_SPEC.md.
"""

from datetime import datetime, timezone
import json
import os
from typing import Optional
from fastapi import APIRouter, Body, Depends, File, Form, Query, Response, UploadFile, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import (
    AnalysisNotFoundError,
    AnalysisStateError,
    AnalysisUnprocessableError,
    DatabaseError,
    EvidenceNotFoundError,
)
from app.core.logging import get_logger
from app.db.models.analysis import Analysis
from app.db.models.evidence import Evidence
from app.db.session import get_db
from app.schemas.analysis import (
    AIForensicsResult,
    AnalysisCreateRequest,
    AnalysisListItem,
    AnalysisListResponse,
    AnalysisResponse,
    AnalysisResult,
    AnalysisUploadResponse,
    TechnicalInspectionResult,
)
from app.services.inspector import inspect_image_file
from app.services.pdf_exporter import generate_analysis_pdf
from app.services.storage import (
    cleanup_stored_file,
    get_absolute_path,
    process_and_store_upload,
)

logger = get_logger("routes.analysis")

router = APIRouter(prefix="/analyses", tags=["analyses"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def build_analysis_response(analysis: Analysis, db: Session) -> AnalysisResponse:
    """Build a typed AnalysisResponse from an Analysis SQLAlchemy model."""
    # Find linked evidence if available
    evidence_id = None
    if analysis.evidence_records:
        evidence_id = analysis.evidence_records[0].id
    else:
        # Check reverse foreign key query
        linked_ev = db.query(Evidence).filter(Evidence.analysis_id == analysis.id).first()
        if linked_ev:
            evidence_id = linked_ev.id

    result_payload: Optional[AnalysisResult] = None
    if analysis.status == "completed" and analysis.result_label:
        try:
            limitations = json.loads(analysis.limitations_json) if analysis.limitations_json else []
        except Exception:
            limitations = []

        technical_inspection: Optional[TechnicalInspectionResult] = None
        ai_forensics: Optional[AIForensicsResult] = None
        if analysis.technical_details_json:
            try:
                raw_details = json.loads(analysis.technical_details_json)
                if isinstance(raw_details, dict) and "technical_inspection" in raw_details:
                    technical_inspection = TechnicalInspectionResult.model_validate(raw_details["technical_inspection"])
                    if "ai_forensics" in raw_details and raw_details["ai_forensics"]:
                        ai_forensics = AIForensicsResult.model_validate(raw_details["ai_forensics"])
                else:
                    # Backward compatibility for historical Slice 3-6 records
                    technical_inspection = TechnicalInspectionResult.model_validate(raw_details)
            except Exception as e:
                logger.warning("Could not deserialize technical_details_json for analysis %s: %s", analysis.id, str(e))

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
        evidence_id=evidence_id,
    )


@router.post(
    "",
    response_model=AnalysisUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register image or evidence for analysis",
    description="Registers an image for analysis either via direct file upload or from an existing Evidence record.",
)
async def create_analysis(
    file: Optional[UploadFile] = File(None, description="Image file to analyze (JPEG, PNG, WEBP)"),
    evidence_id: Optional[str] = Form(None, description="Existing Evidence record UUID to analyze"),
    save_to_vault: bool = Form(False, description="Whether to also preserve this upload in the Evidence Vault"),
    db: Session = Depends(get_db),
) -> AnalysisUploadResponse:
    """Register an image for analysis, conforming to docs/API_SPEC.md Section 5."""
    # Case A: Analysis initiated from an existing Evidence record
    if evidence_id:
        clean_ev_id = evidence_id.strip()
        evidence = db.query(Evidence).filter(Evidence.id == clean_ev_id).first()
        if not evidence:
            raise EvidenceNotFoundError(f"Evidence record '{clean_ev_id}' does not exist.")

        # If evidence already has an analysis, return existing or create new run
        analysis = Analysis(
            original_filename=evidence.original_filename,
            storage_key=evidence.storage_key,
            file_size_bytes=evidence.file_size_bytes,
            mime_type_detected=evidence.mime_type_detected,
            sha256=evidence.sha256,
            status="uploaded",
        )
        db.add(analysis)
        db.flush()
        evidence.analysis_id = analysis.id
        db.commit()
        db.refresh(analysis)

        logger.info("Created analysis %s linked to evidence %s", analysis.id, evidence.id)
        return AnalysisUploadResponse(
            id=analysis.id,
            filename=analysis.original_filename,
            status=analysis.status,
            created_at=analysis.created_at,
            saved_to_vault=True,
            evidence_id=evidence.id,
        )

    # Case B: Analysis from direct multipart file upload
    if not file:
        raise AnalysisUnprocessableError("Either an image file or an evidence_id must be provided.")

    stored_meta = await process_and_store_upload(
        upload_stream=file,
        original_filename=file.filename,
    )

    try:
        analysis = Analysis(
            original_filename=stored_meta.original_filename,
            storage_key=stored_meta.storage_key,
            file_size_bytes=stored_meta.file_size_bytes,
            mime_type_detected=stored_meta.mime_type_detected,
            sha256=stored_meta.sha256,
            status="uploaded",
        )
        db.add(analysis)
        db.flush()

        evidence_record_id: Optional[str] = None
        if save_to_vault:
            evidence = Evidence(
                analysis_id=analysis.id,
                original_filename=stored_meta.original_filename,
                storage_key=stored_meta.storage_key,
                file_size_bytes=stored_meta.file_size_bytes,
                mime_type_detected=stored_meta.mime_type_detected,
                sha256=stored_meta.sha256,
                description="Auto-saved during image analysis intake",
            )
            db.add(evidence)
            db.flush()
            evidence_record_id = evidence.id

        db.commit()
        db.refresh(analysis)

        logger.info("Analysis registered: id=%s, sha256=%s", analysis.id, analysis.sha256)
        return AnalysisUploadResponse(
            id=analysis.id,
            filename=analysis.original_filename,
            status=analysis.status,
            created_at=analysis.created_at,
            saved_to_vault=save_to_vault,
            evidence_id=evidence_record_id,
        )

    except Exception as exc:
        db.rollback()
        cleanup_stored_file(stored_meta.storage_key)
        logger.error("Failed to persist analysis record: %s", str(exc), exc_info=True)
        raise DatabaseError("Failed to persist analysis record in the database.") from exc


@router.post(
    "/{analysis_id}/run",
    response_model=AnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Run technical image inspection on an analysis record",
    description="Executes verifiable technical image inspection, metadata analysis, and integrity checks on the stored image.",
)
def run_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Run the technical inspection pipeline on an uploaded image, conforming to docs/API_SPEC.md Section 6."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise AnalysisNotFoundError(f"Analysis '{analysis_id}' was not found.")

    # Resolve local storage path
    try:
        abs_path = get_absolute_path(analysis.storage_key)
    except Exception as exc:
        raise AnalysisUnprocessableError(f"Cannot resolve storage path: {str(exc)}")

    if not os.path.exists(abs_path):
        raise AnalysisUnprocessableError("Underlying evidence file is missing from local storage.")

    # Transition status to processing
    analysis.status = "processing"
    db.commit()

    try:
        # Execute technical image inspection
        inspection_result = inspect_image_file(
            file_path=abs_path,
            file_size_bytes=analysis.file_size_bytes,
            detected_mime=analysis.mime_type_detected,
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

        # Store structured details payload with technical inspection and ai_forensics
        details_payload = {}
        if inspection_result.technical_inspection:
            details_payload["technical_inspection"] = inspection_result.technical_inspection.model_dump()
        if inspection_result.ai_forensics:
            details_payload["ai_forensics"] = inspection_result.ai_forensics.model_dump()
        analysis.technical_details_json = json.dumps(details_payload)
        analysis.error_code = None
        analysis.completed_at = utc_now()
        analysis.updated_at = utc_now()

        db.commit()
        db.refresh(analysis)

        logger.info(
            "Analysis %s completed successfully with label %s",
            analysis.id,
            analysis.result_label,
        )
        return build_analysis_response(analysis, db)

    except Exception as exc:
        db.rollback()
        analysis.status = "failed"
        analysis.error_code = "INSPECTION_FAILED"
        analysis.updated_at = utc_now()
        db.commit()
        logger.error("Analysis execution failed for %s: %s", analysis_id, str(exc), exc_info=True)
        raise AnalysisUnprocessableError(f"Analysis execution failed: {str(exc)}") from exc


@router.get(
    "/{analysis_id}",
    response_model=AnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve an analysis report",
    description="Retrieves a saved analysis record, inspection findings, metadata, and disclaimers.",
)
def get_analysis_by_id(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Retrieve a persisted analysis report, conforming to docs/API_SPEC.md Section 7."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise AnalysisNotFoundError(f"Analysis '{analysis_id}' was not found.")

    return build_analysis_response(analysis, db)


@router.get(
    "",
    response_model=AnalysisListResponse,
    status_code=status.HTTP_200_OK,
    summary="List analysis records",
    description="Returns a paginated list of saved analysis records ordered newest first.",
)
def list_analyses(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: Session = Depends(get_db),
) -> AnalysisListResponse:
    """List saved analyses with pagination, conforming to docs/API_SPEC.md Section 7."""
    total = db.query(Analysis).count()
    records = (
        db.query(Analysis)
        .order_by(desc(Analysis.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        AnalysisListItem(
            id=r.id,
            original_filename=r.original_filename,
            status=r.status,
            result_label=r.result_label,
            analysis_method=r.analysis_method,
            sha256=r.sha256,
            file_size_bytes=r.file_size_bytes,
            created_at=r.created_at,
            completed_at=r.completed_at,
        )
        for r in records
    ]

    return AnalysisListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{analysis_id}/export",
    summary="Export forensic analysis report as PDF",
    description="Generates an in-memory downloadable PDF technical inspection report from persisted records.",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Downloadable PDF technical forensic report.",
        },
        404: {"description": "Analysis not found."},
        409: {"description": "Analysis incomplete or failed; cannot be exported."},
    },
)
def export_analysis_pdf(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> Response:
    """Generate a downloadable PDF report for a completed analysis.
    Conforms to docs/API_SPEC.md Section 10 and docs/ACCEPTANCE_CRITERIA.md AC-08.
    """
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise AnalysisNotFoundError(f"Analysis '{analysis_id}' was not found.")

    if analysis.status != "completed":
        raise AnalysisStateError(
            f"Analysis '{analysis_id}' cannot be exported in status '{analysis.status}'. "
            "Only completed analyses can be exported."
        )

    pdf_bytes = generate_analysis_pdf(analysis, db)
    safe_filename = f"haven-analysis-{analysis.id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "Content-Length": str(len(pdf_bytes)),
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
        },
    )
