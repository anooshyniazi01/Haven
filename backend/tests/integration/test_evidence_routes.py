"""Integration tests for Evidence Vault API endpoints (POST /api/v1/evidence, GET /api/v1/evidence/{id})."""

import hashlib
import io
import os
from unittest.mock import patch
from fastapi.testclient import TestClient
from PIL import Image
import pytest
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.evidence import Evidence


def create_test_image_bytes(fmt: str = "JPEG", size=(40, 40)) -> bytes:
    """Generate in-memory synthetic image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=(50, 100, 150))
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_upload_evidence_success(client: TestClient, test_db_session: Session, temp_storage_dir: str):
    image_bytes = create_test_image_bytes("JPEG")
    expected_hash = hashlib.sha256(image_bytes).hexdigest().lower()

    response = client.post(
        "/api/v1/evidence",
        files={"file": ("suspicious_item.jpg", image_bytes, "image/jpeg")},
        data={"description": "Received via direct message."},
    )

    assert response.status_code == 201
    data = response.json()

    assert "id" in data
    assert data["original_filename"] == "suspicious_item.jpg"
    assert data["mime_type_detected"] == "image/jpeg"
    assert data["file_size_bytes"] == len(image_bytes)
    assert data["sha256"] == expected_hash
    assert data["description"] == "Received via direct message."
    assert "created_at" in data

    # Verify database persistence
    db_record = test_db_session.query(Evidence).filter(Evidence.id == data["id"]).first()
    assert db_record is not None
    assert db_record.sha256 == expected_hash
    assert db_record.file_size_bytes == len(image_bytes)

    # Verify physical file matches exact bytes and hash
    full_path = os.path.join(temp_storage_dir, db_record.storage_key)
    assert os.path.exists(full_path)
    with open(full_path, "rb") as f:
        stored_bytes = f.read()
    assert stored_bytes == image_bytes
    assert hashlib.sha256(stored_bytes).hexdigest().lower() == expected_hash

    # Verify GET /api/v1/evidence/{id}
    get_res = client.get(f"/api/v1/evidence/{data['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["sha256"] == expected_hash


def test_upload_evidence_png_success(client: TestClient):
    png_bytes = create_test_image_bytes("PNG")
    expected_hash = hashlib.sha256(png_bytes).hexdigest().lower()

    response = client.post(
        "/api/v1/evidence",
        files={"file": ("evidence_screenshot.png", png_bytes, "image/png")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["mime_type_detected"] == "image/png"
    assert data["sha256"] == expected_hash
    assert data["description"] is None


def test_upload_evidence_webp_success(client: TestClient):
    webp_bytes = create_test_image_bytes("WEBP")
    expected_hash = hashlib.sha256(webp_bytes).hexdigest().lower()

    response = client.post(
        "/api/v1/evidence",
        files={"file": ("sticker.webp", webp_bytes, "image/webp")},
    )

    assert response.status_code == 201
    assert response.json()["mime_type_detected"] == "image/webp"
    assert response.json()["sha256"] == expected_hash


def test_upload_evidence_unsupported_media_type(client: TestClient):
    # Text file disguised with .jpg extension
    fake_image = b"This is a text file posing as an image."

    response = client.post(
        "/api/v1/evidence",
        files={"file": ("malicious.jpg", fake_image, "image/jpeg")},
    )

    assert response.status_code == 415
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"
    assert "supported_formats" in data["error"].get("details", {})


def test_upload_evidence_empty_file(client: TestClient):
    response = client.post(
        "/api/v1/evidence",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
    )

    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "INVALID_FILE"
    assert "empty" in data["error"]["message"].lower()


def test_upload_evidence_corrupted_image(client: TestClient):
    # Starts with valid JPEG header but corrupt payload
    corrupt_bytes = b"\xff\xd8\xff\xe0" + b"\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00garbage"

    response = client.post(
        "/api/v1/evidence",
        files={"file": ("corrupt.jpg", corrupt_bytes, "image/jpeg")},
    )

    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "INVALID_FILE"


def test_upload_evidence_too_large(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    # Set limit to 500 bytes for this test
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 1)  # config in MB
    large_payload = b"\xff\xd8\xff\xe0" + b"X" * (1024 * 1024 + 50)

    response = client.post(
        "/api/v1/evidence",
        files={"file": ("large.jpg", large_payload, "image/jpeg")},
    )

    assert response.status_code == 413
    data = response.json()
    assert data["error"]["code"] == "FILE_TOO_LARGE"


def test_upload_evidence_path_traversal_filename_safe(client: TestClient, temp_storage_dir: str):
    image_bytes = create_test_image_bytes("JPEG")

    response = client.post(
        "/api/v1/evidence",
        files={"file": ("../../../../etc/passwd", image_bytes, "image/jpeg")},
    )

    assert response.status_code == 201
    data = response.json()
    # Safe display filename stripped of directory traversal components
    assert data["original_filename"] == "passwd"
    # Filesystem check: file must be stored under temp_storage_dir/evidence
    evidence_dir = os.path.join(temp_storage_dir, "evidence")
    stored_files = os.listdir(evidence_dir)
    assert len(stored_files) == 1
    # File name on disk must be UUID-based, NOT 'passwd'
    assert not stored_files[0].startswith("passwd")


def test_upload_evidence_db_failure_cleans_up_file(client: TestClient, temp_storage_dir: str):
    image_bytes = create_test_image_bytes("JPEG")

    # Simulate database failure during commit
    with patch.object(Session, "commit", side_effect=Exception("Database lock error")):
        response = client.post(
            "/api/v1/evidence",
            files={"file": ("test.jpg", image_bytes, "image/jpeg")},
        )

    assert response.status_code == 503
    data = response.json()
    assert data["error"]["code"] == "DATABASE_ERROR"

    # Verify no orphaned files remain in evidence dir
    evidence_dir = os.path.join(temp_storage_dir, "evidence")
    if os.path.exists(evidence_dir):
        remaining_files = os.listdir(evidence_dir)
        assert len(remaining_files) == 0


def test_get_evidence_by_id_not_found(client: TestClient):
    response = client.get("/api/v1/evidence/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
