"""Integration tests for Analysis endpoints.
Conforms to docs/API_SPEC.md Section 5, 6, 7 and docs/AI_SPEC.md.
"""

import io
from fastapi.testclient import TestClient
from PIL import Image
import pytest


def create_test_png(width: int = 400, height: int = 300) -> bytes:
    """Generate a clean synthetic PNG image for route tests."""
    img = Image.new("RGB", (width, height), color=(60, 120, 180))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestAnalysisRoutes:
    def test_create_analysis_via_direct_upload(self, client: TestClient):
        img_bytes = create_test_png(500, 400)
        response = client.post(
            "/api/v1/analyses",
            files={"file": ("photo.png", img_bytes, "image/png")},
            data={"save_to_vault": "false"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["filename"] == "photo.png"
        assert data["status"] == "uploaded"
        assert data["saved_to_vault"] is False

    def test_run_analysis_success(self, client: TestClient):
        img_bytes = create_test_png(800, 600)
        # 1. Register analysis
        create_res = client.post(
            "/api/v1/analyses",
            files={"file": ("chart.png", img_bytes, "image/png")},
        )
        assert create_res.status_code == 201
        analysis_id = create_res.json()["id"]

        # 2. Run technical inspection
        run_res = client.post(f"/api/v1/analyses/{analysis_id}/run")
        assert run_res.status_code == 200
        data = run_res.json()
        assert data["id"] == analysis_id
        assert data["status"] == "completed"
        assert data["analysis_method"] in [
            "technical_and_ai_synthetic_inspection",
            "technical_image_inspection",
        ]
        if data["analysis_method"] == "technical_and_ai_synthetic_inspection":
            assert data["model_name"] == "ai-image-detect-distilled-onnx"
            assert data["model_version"] == "1.0.0"
        assert data["completed_at"] is not None

        # Verify structured result
        result = data["result"]
        assert result is not None
        assert result["label"] in [
            "low_synthetic_indicators",
            "inconclusive_synthetic_signals",
            "elevated_synthetic_indicators",
            "technical_inspection_completed",
        ]
        if data["analysis_method"] == "technical_and_ai_synthetic_inspection":
            assert result["score"] is not None
            assert 0.0 <= result["score"] <= 1.0
            assert result["score_type"] == "raw_model_score_synthetic_probability"
            assert result["ai_forensics"] is not None
            assert result["ai_forensics"]["status"] == "success"
        assert "800x600" in result["explanation"]
        assert len(result["limitations"]) >= 4


        ti = result["technical_inspection"]
        assert ti is not None
        assert ti["dimensions"]["width"] == 800
        assert ti["dimensions"]["height"] == 600
        assert ti["dimensions"]["aspect_ratio"] == "4:3"
        assert ti["format"] == "PNG"
        assert ti["mode"] == "RGB"
        assert ti["color_channels"] == 3
        assert ti["metadata_summary"]["has_exif"] is False
        assert "execution completed" in ti["ai_model_status"].lower() or "unavailable" in ti["ai_model_status"].lower()

    def test_get_persisted_analysis_report(self, client: TestClient):
        img_bytes = create_test_png(300, 300)
        create_res = client.post(
            "/api/v1/analyses",
            files={"file": ("square.png", img_bytes, "image/png")},
        )
        analysis_id = create_res.json()["id"]
        client.post(f"/api/v1/analyses/{analysis_id}/run")

        # Retrieve saved report
        get_res = client.get(f"/api/v1/analyses/{analysis_id}")
        assert get_res.status_code == 200
        report = get_res.json()
        assert report["id"] == analysis_id
        assert report["status"] == "completed"
        assert report["original_filename"] == "square.png"
        assert report["result"]["technical_inspection"]["dimensions"]["width"] == 300
        assert report["result"]["technical_inspection"]["dimensions"]["aspect_ratio"] == "1:1"

    def test_create_and_run_analysis_from_existing_evidence(self, client: TestClient):
        img_bytes = create_test_png(640, 360)
        # 1. Upload evidence via Slice 2 endpoint
        ev_res = client.post(
            "/api/v1/evidence",
            files={"file": ("evidence_doc.png", img_bytes, "image/png")},
            data={"description": "Intake item for analysis"},
        )
        assert ev_res.status_code == 201
        evidence_id = ev_res.json()["id"]

        # 2. Register analysis using evidence_id
        analysis_res = client.post(
            "/api/v1/analyses",
            data={"evidence_id": evidence_id},
        )
        assert analysis_res.status_code == 201
        analysis_data = analysis_res.json()
        assert analysis_data["evidence_id"] == evidence_id
        analysis_id = analysis_data["id"]

        # 3. Run analysis
        run_res = client.post(f"/api/v1/analyses/{analysis_id}/run")
        assert run_res.status_code == 200
        report = run_res.json()
        assert report["status"] == "completed"
        assert report["evidence_id"] == evidence_id
        assert report["result"]["technical_inspection"]["dimensions"]["width"] == 640
        assert report["result"]["technical_inspection"]["dimensions"]["height"] == 360
        assert report["result"]["technical_inspection"]["dimensions"]["aspect_ratio"] == "16:9"

    def test_convenience_analyze_evidence_endpoint(self, client: TestClient):
        img_bytes = create_test_png(1280, 720)
        # Upload evidence
        ev_res = client.post(
            "/api/v1/evidence",
            files={"file": ("screenshot.png", img_bytes, "image/png")},
        )
        evidence_id = ev_res.json()["id"]

        # 1-click analyze evidence
        analyze_res = client.post(f"/api/v1/evidence/{evidence_id}/analyze")
        assert analyze_res.status_code == 200
        data = analyze_res.json()
        assert data["status"] == "completed"
        assert data["evidence_id"] == evidence_id
        assert data["result"]["technical_inspection"]["dimensions"]["width"] == 1280
        assert data["result"]["technical_inspection"]["dimensions"]["height"] == 720
        assert data["result"]["technical_inspection"]["dimensions"]["aspect_ratio"] == "16:9"

    def test_list_analyses_with_pagination(self, client: TestClient):
        img_bytes = create_test_png(100, 100)
        client.post("/api/v1/analyses", files={"file": ("img1.png", img_bytes, "image/png")})
        client.post("/api/v1/analyses", files={"file": ("img2.png", img_bytes, "image/png")})

        list_res = client.get("/api/v1/analyses?limit=5&offset=0")
        assert list_res.status_code == 200
        data = list_res.json()
        assert data["total"] >= 2
        assert len(data["items"]) >= 2
        assert data["limit"] == 5
        assert data["offset"] == 0

    def test_run_analysis_not_found(self, client: TestClient):
        res = client.post("/api/v1/analyses/00000000-0000-0000-0000-000000000000/run")
        assert res.status_code == 404
        assert res.json()["error"]["code"] == "ANALYSIS_NOT_FOUND"

    def test_get_analysis_not_found(self, client: TestClient):
        res = client.get("/api/v1/analyses/00000000-0000-0000-0000-000000000000")
        assert res.status_code == 404
        assert res.json()["error"]["code"] == "ANALYSIS_NOT_FOUND"

    def test_create_analysis_with_invalid_evidence_id(self, client: TestClient):
        res = client.post(
            "/api/v1/analyses",
            data={"evidence_id": "00000000-0000-0000-0000-000000000000"},
        )
        assert res.status_code == 404
        assert res.json()["error"]["code"] == "EVIDENCE_NOT_FOUND"

    def test_create_analysis_without_file_or_evidence_id(self, client: TestClient):
        res = client.post("/api/v1/analyses")
        assert res.status_code == 422
