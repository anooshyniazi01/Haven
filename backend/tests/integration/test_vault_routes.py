"""Integration tests for Evidence Vault API endpoints:
- GET /api/v1/evidence (listing, search, pagination, filter)
- GET /api/v1/evidence/{id} (detail view with analysis summary and file existence)
- POST /api/v1/evidence/{id}/verify (cryptographic SHA-256 integrity check)
"""

import hashlib
import io
import os
from fastapi.testclient import TestClient
from PIL import Image
import pytest
from sqlalchemy.orm import Session

from app.db.models.evidence import Evidence


def create_test_image_bytes(fmt: str = "JPEG", size=(50, 50)) -> bytes:
    """Generate in-memory synthetic image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=(60, 120, 180))
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_list_evidence_empty(client: TestClient):
    response = client.get("/api/v1/evidence")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["limit"] == 20
    assert data["offset"] == 0


def test_list_evidence_pagination_and_ordering(client: TestClient):
    # Upload 3 items
    for i in range(3):
        img_bytes = create_test_image_bytes("PNG", size=(30 + i * 10, 30 + i * 10))
        res = client.post(
            "/api/v1/evidence",
            files={"file": (f"test_evidence_{i}.png", img_bytes, "image/png")},
            data={"description": f"Test item number {i}"},
        )
        assert res.status_code == 201

    # First page: limit 2
    res_page1 = client.get("/api/v1/evidence?limit=2&offset=0")
    assert res_page1.status_code == 200
    data_page1 = res_page1.json()
    assert data_page1["total"] == 3
    assert len(data_page1["items"]) == 2
    assert data_page1["items"][0]["original_filename"] == "test_evidence_2.png"  # Newest first

    # Second page: limit 2, offset 2
    res_page2 = client.get("/api/v1/evidence?limit=2&offset=2")
    assert res_page2.status_code == 200
    data_page2 = res_page2.json()
    assert data_page2["total"] == 3
    assert len(data_page2["items"]) == 1
    assert data_page2["items"][0]["original_filename"] == "test_evidence_0.png"


def test_list_evidence_search_filter(client: TestClient):
    img1 = create_test_image_bytes("JPEG", size=(40, 40))
    img2 = create_test_image_bytes("PNG", size=(40, 40))

    client.post(
        "/api/v1/evidence",
        files={"file": ("ransom_demand_screenshot.png", img1, "image/png")},
        data={"description": "Demanding bitcoin in anonymous message"},
    )
    client.post(
        "/api/v1/evidence",
        files={"file": ("family_photo_unrelated.jpg", img2, "image/jpeg")},
        data={"description": "Vacation picture"},
    )

    # Search for "ransom"
    res_ransom = client.get("/api/v1/evidence?search=ransom")
    assert res_ransom.status_code == 200
    data_ransom = res_ransom.json()
    assert data_ransom["total"] == 1
    assert data_ransom["items"][0]["original_filename"] == "ransom_demand_screenshot.png"

    # Search for "bitcoin" in description
    res_bitcoin = client.get("/api/v1/evidence?search=bitcoin")
    assert res_bitcoin.status_code == 200
    assert res_bitcoin.json()["total"] == 1

    # Non-matching search
    res_none = client.get("/api/v1/evidence?search=nonexistent_token_12345")
    assert res_none.status_code == 200
    assert res_none.json()["total"] == 0
    assert res_none.json()["items"] == []


def test_list_evidence_has_analysis_filter(client: TestClient):
    img1 = create_test_image_bytes("JPEG", size=(40, 40))
    img2 = create_test_image_bytes("JPEG", size=(50, 50))

    res1 = client.post(
        "/api/v1/evidence",
        files={"file": ("to_be_analyzed.jpg", img1, "image/jpeg")},
    )
    ev1_id = res1.json()["id"]

    res2 = client.post(
        "/api/v1/evidence",
        files={"file": ("not_analyzed.jpg", img2, "image/jpeg")},
    )
    ev2_id = res2.json()["id"]

    # Analyze first evidence item
    analyze_res = client.post(f"/api/v1/evidence/{ev1_id}/analyze")
    assert analyze_res.status_code == 200

    # Filter has_analysis=true
    res_true = client.get("/api/v1/evidence?has_analysis=true")
    assert res_true.status_code == 200
    items_true = res_true.json()["items"]
    assert any(it["id"] == ev1_id for it in items_true)
    assert not any(it["id"] == ev2_id for it in items_true)

    # Filter has_analysis=false
    res_false = client.get("/api/v1/evidence?has_analysis=false")
    assert res_false.status_code == 200
    items_false = res_false.json()["items"]
    assert any(it["id"] == ev2_id for it in items_false)
    assert not any(it["id"] == ev1_id for it in items_false)


def test_get_evidence_detail_with_analysis_summary(client: TestClient):
    img_bytes = create_test_image_bytes("PNG", size=(60, 60))
    upload_res = client.post(
        "/api/v1/evidence",
        files={"file": ("case_photo.png", img_bytes, "image/png")},
        data={"description": "Found in inbox"},
    )
    ev_id = upload_res.json()["id"]

    # Run inspection
    client.post(f"/api/v1/evidence/{ev_id}/analyze")

    # Detail request
    detail_res = client.get(f"/api/v1/evidence/{ev_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()

    assert detail["id"] == ev_id
    assert detail["original_filename"] == "case_photo.png"
    assert detail["file_exists"] is True
    assert detail["has_analysis"] is True
    assert detail["analysis_status"] == "completed"
    assert detail["analysis_summary"] is not None
    assert detail["analysis_summary"]["status"] == "completed"
    assert detail["analysis_summary"]["analysis_method"] == "technical_image_inspection"
    assert "limitations" in detail["analysis_summary"]


def test_verify_evidence_integrity_success(client: TestClient):
    img_bytes = create_test_image_bytes("JPEG", size=(64, 64))
    expected_hash = hashlib.sha256(img_bytes).hexdigest().lower()

    upload_res = client.post(
        "/api/v1/evidence",
        files={"file": ("integrity_check.jpg", img_bytes, "image/jpeg")},
    )
    ev_id = upload_res.json()["id"]

    # Run verification
    verify_res = client.post(f"/api/v1/evidence/{ev_id}/verify")
    assert verify_res.status_code == 200
    data = verify_res.json()

    assert data["evidence_id"] == ev_id
    assert data["status"] == "match"
    assert data["recorded_sha256"] == expected_hash
    assert data["computed_sha256"] == expected_hash
    assert "matches the recorded baseline hash" in data["message"]
    assert "disclaimer" in data


def test_verify_evidence_integrity_mismatch(client: TestClient, test_db_session: Session, temp_storage_dir: str):
    img_bytes = create_test_image_bytes("JPEG", size=(40, 40))

    upload_res = client.post(
        "/api/v1/evidence",
        files={"file": ("tamper_test.jpg", img_bytes, "image/jpeg")},
    )
    ev_id = upload_res.json()["id"]

    # Tamper with the file on disk directly
    db_ev = test_db_session.query(Evidence).filter(Evidence.id == ev_id).first()
    file_path = os.path.join(temp_storage_dir, db_ev.storage_key)
    with open(file_path, "wb") as f:
        f.write(b"Tampered or altered content that alters hash")

    verify_res = client.post(f"/api/v1/evidence/{ev_id}/verify")
    assert verify_res.status_code == 200
    data = verify_res.json()

    assert data["status"] == "mismatch"
    assert data["recorded_sha256"] != data["computed_sha256"]
    assert "mismatch" in data["message"].lower()


def test_verify_evidence_integrity_file_missing(client: TestClient, test_db_session: Session, temp_storage_dir: str):
    img_bytes = create_test_image_bytes("JPEG", size=(40, 40))

    upload_res = client.post(
        "/api/v1/evidence",
        files={"file": ("missing_test.jpg", img_bytes, "image/jpeg")},
    )
    ev_id = upload_res.json()["id"]

    # Delete physical file
    db_ev = test_db_session.query(Evidence).filter(Evidence.id == ev_id).first()
    file_path = os.path.join(temp_storage_dir, db_ev.storage_key)
    if os.path.exists(file_path):
        os.remove(file_path)

    verify_res = client.post(f"/api/v1/evidence/{ev_id}/verify")
    assert verify_res.status_code == 200
    data = verify_res.json()

    assert data["status"] == "unavailable"
    assert data["computed_sha256"] is None
    assert "could not be found" in data["message"]


def test_verify_evidence_not_found(client: TestClient):
    verify_res = client.post("/api/v1/evidence/00000000-0000-0000-0000-000000000000/verify")
    assert verify_res.status_code == 404
