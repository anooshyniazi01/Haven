"""Integration tests for PDF Report Export endpoint GET /api/v1/analyses/{analysis_id}/export.
Conforms to docs/API_SPEC.md Section 10, docs/ACCEPTANCE_CRITERIA.md AC-08,
docs/PRIVACY.md Section 12, and docs/SECURITY.md.
"""

import io
import os
from fastapi.testclient import TestClient
from PIL import Image
import pytest
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.analysis import Analysis


def create_test_png(width: int = 640, height: int = 480) -> bytes:
    """Generate a clean synthetic PNG image for route tests."""
    img = Image.new("RGB", (width, height), color=(30, 90, 150))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestPdfExportRoutes:
    def test_export_pdf_success_completed_analysis(self, client: TestClient):
        """Test successful export of a completed analysis report as a valid PDF."""
        img_bytes = create_test_png(800, 600)
        # 1. Register analysis
        create_res = client.post(
            "/api/v1/analyses",
            files={"file": ("evidence_chart.png", img_bytes, "image/png")},
        )
        assert create_res.status_code == 201
        analysis_id = create_res.json()["id"]

        # 2. Run analysis
        run_res = client.post(f"/api/v1/analyses/{analysis_id}/run")
        assert run_res.status_code == 200
        analysis_data = run_res.json()
        assert analysis_data["status"] == "completed"
        sha256 = analysis_data["sha256"]

        # Track files on disk before export
        storage_dir = settings.STORAGE_ROOT
        files_before = set(os.listdir(storage_dir)) if os.path.exists(storage_dir) else set()

        # 3. Export PDF
        export_res = client.get(f"/api/v1/analyses/{analysis_id}/export")
        assert export_res.status_code == 200
        assert export_res.headers["content-type"] == "application/pdf"
        assert f'filename="haven-analysis-{analysis_id}.pdf"' in export_res.headers["content-disposition"]

        pdf_bytes = export_res.content
        assert len(pdf_bytes) > 500
        # Check PDF magic bytes (%PDF-)
        assert pdf_bytes.startswith(b"%PDF-")

        # Verify disk storage was NOT polluted with any new files
        files_after = set(os.listdir(storage_dir)) if os.path.exists(storage_dir) else set()
        assert files_after == files_before, "PDF generation must not create files on disk"

        # Check content inside PDF binary stream
        pdf_text = pdf_bytes.decode("latin-1", errors="ignore")
        assert "HAVEN FORENSIC WORKSPACE" in pdf_text
        assert "Technical Image Inspection Report" in pdf_text
        assert "evidence_chart.png" in pdf_text
        assert sha256 in pdf_text
        assert "800" in pdf_text  # Width
        assert "600" in pdf_text  # Height
        assert "A matching SHA-256 digest indicates" in pdf_text
        assert "Notice" in pdf_text

    def test_export_pdf_returns_404_for_unknown_analysis(self, client: TestClient):
        """Exporting an unknown analysis UUID must return 404."""
        unknown_id = "00000000-0000-0000-0000-000000000000"
        res = client.get(f"/api/v1/analyses/{unknown_id}/export")
        assert res.status_code == 404
        data = res.json()
        assert data["error"]["code"] == "ANALYSIS_NOT_FOUND"

    def test_export_pdf_returns_409_for_incomplete_analysis(self, client: TestClient):
        """Analysis in 'uploaded' or 'processing' status cannot be exported and must return 409."""
        img_bytes = create_test_png(400, 300)
        create_res = client.post(
            "/api/v1/analyses",
            files={"file": ("unprocessed.png", img_bytes, "image/png")},
        )
        assert create_res.status_code == 201
        analysis_id = create_res.json()["id"]

        # Attempt to export before running
        res = client.get(f"/api/v1/analyses/{analysis_id}/export")
        assert res.status_code == 409
        data = res.json()
        assert data["error"]["code"] == "ANALYSIS_STATE_INVALID"
        assert "Only completed analyses can be exported" in data["error"]["message"]

    def test_export_pdf_returns_409_for_failed_analysis(self, client: TestClient, test_db_session: Session):
        """Analysis in 'failed' status cannot be exported and must return 409."""
        # Insert a failed analysis record manually into test DB
        failed_analysis = Analysis(
            id="failed-analysis-uuid",
            original_filename="corrupted.png",
            storage_key="dummy_key",
            file_size_bytes=100,
            mime_type_detected="image/png",
            sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            status="failed",
            error_code="ANALYSIS_FAILED",
        )
        test_db_session.add(failed_analysis)
        test_db_session.commit()

        res = client.get("/api/v1/analyses/failed-analysis-uuid/export")
        assert res.status_code == 409
        data = res.json()
        assert data["error"]["code"] == "ANALYSIS_STATE_INVALID"

    def test_export_pdf_handles_untrusted_filename_and_special_characters(self, client: TestClient):
        """Filenames with quotes, XML tags, and Unicode characters must render safely without breaking."""
        weird_filename = "test_<script>alert('xss')</script>_&_special_“quotes”—file.png"
        img_bytes = create_test_png(500, 500)
        create_res = client.post(
            "/api/v1/analyses",
            files={"file": (weird_filename, img_bytes, "image/png")},
        )
        assert create_res.status_code == 201
        analysis_id = create_res.json()["id"]

        # Run analysis
        run_res = client.post(f"/api/v1/analyses/{analysis_id}/run")
        assert run_res.status_code == 200

        # Export PDF
        export_res = client.get(f"/api/v1/analyses/{analysis_id}/export")
        assert export_res.status_code == 200
        assert export_res.headers["content-type"] == "application/pdf"
        assert export_res.content.startswith(b"%PDF-")

    def test_export_pdf_excludes_internal_paths_and_secrets(self, client: TestClient):
        """Generated PDF must not leak internal storage keys or server filesystem paths."""
        img_bytes = create_test_png(400, 400)
        create_res = client.post(
            "/api/v1/analyses",
            files={"file": ("private_test.png", img_bytes, "image/png")},
        )
        analysis_id = create_res.json()["id"]
        client.post(f"/api/v1/analyses/{analysis_id}/run")

        export_res = client.get(f"/api/v1/analyses/{analysis_id}/export")
        assert export_res.status_code == 200

        pdf_text = export_res.content.decode("latin-1", errors="ignore")
        # Ensure server storage paths are NOT present
        assert settings.STORAGE_ROOT not in pdf_text
        assert "storage_key" not in pdf_text
