"""Integration tests for Incident Tracker API routes:
- GET /api/v1/incidents (listing, pagination, search, status filtering, evidence counting)
- POST /api/v1/incidents (creation, validation, atomic evidence association)
- GET /api/v1/incidents/{id} (details, linked evidence metadata, file existence)
- PATCH /api/v1/incidents/{id} (partial updates, attaching/detaching evidence)
- DELETE /api/v1/incidents/{id} (safe deletion, association cleanup, evidence preservation)
"""

import io
import os
from fastapi.testclient import TestClient
from PIL import Image
import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.evidence import Evidence
from app.db.models.incident import Incident
from app.db.models.incident_evidence import IncidentEvidence
from app.services.storage import get_absolute_path


def create_test_image_bytes(fmt: str = "PNG", size=(40, 40)) -> bytes:
    """Generate in-memory synthetic image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=(80, 160, 240))
    img.save(buf, format=fmt)
    return buf.getvalue()


def upload_test_evidence(client: TestClient, filename: str = "threat_letter.png") -> dict:
    """Helper to upload an evidence item through the API."""
    img_bytes = create_test_image_bytes("PNG")
    res = client.post(
        "/api/v1/evidence",
        files={"file": (filename, img_bytes, "image/png")},
        data={"description": "Test evidence for incident linking"},
    )
    assert res.status_code == 201
    return res.json()


def test_list_incidents_empty(client: TestClient):
    """Verify empty incident list returns zero items and correct pagination metadata."""
    res = client.get("/api/v1/incidents")
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["limit"] == 10
    assert data["offset"] == 0


def test_create_incident_title_only(client: TestClient):
    """Verify creating an incident with only a required title."""
    res = client.post(
        "/api/v1/incidents",
        json={"title": "Anonymous blackmail demand on messaging app"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Anonymous blackmail demand on messaging app"
    assert data["description"] is None
    assert data["incident_date"] is None
    assert data["status"] == "open"
    assert data["evidence_count"] == 0
    assert data["linked_evidence"] == []
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_incident_all_fields(client: TestClient):
    """Verify creating an incident with all supported fields."""
    ev = upload_test_evidence(client, "ransom_message.png")

    payload = {
        "title": "Extortion threat via Telegram",
        "description": "Perpetrator threatened exposure unless cryptocurrency was transferred.",
        "incident_date": "2026-10-16",
        "status": "documented",
        "evidence_ids": [ev["id"]],
    }
    res = client.post("/api/v1/incidents", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Extortion threat via Telegram"
    assert data["description"] == "Perpetrator threatened exposure unless cryptocurrency was transferred."
    assert data["incident_date"] == "2026-10-16"
    assert data["status"] == "documented"
    assert data["evidence_count"] == 1
    assert len(data["linked_evidence"]) == 1
    linked = data["linked_evidence"][0]
    assert linked["id"] == ev["id"]
    assert linked["original_filename"] == "ransom_message.png"
    assert linked["file_exists"] is True


def test_create_incident_rejects_empty_or_whitespace_title(client: TestClient):
    """Verify that blank or whitespace-only titles are rejected with 422."""
    res1 = client.post("/api/v1/incidents", json={"title": ""})
    assert res1.status_code == 422

    res2 = client.post("/api/v1/incidents", json={"title": "   "})
    assert res2.status_code == 422


def test_create_incident_rejects_invalid_status(client: TestClient):
    """Verify that unsupported status values are rejected with 422."""
    res = client.post(
        "/api/v1/incidents",
        json={"title": "Test Incident", "status": "critical_emergency"},
    )
    assert res.status_code == 422


def test_create_incident_rejects_invalid_date_format(client: TestClient):
    """Verify that malformed dates are rejected with 422."""
    res = client.post(
        "/api/v1/incidents",
        json={"title": "Test Incident", "incident_date": "not-a-real-date"},
    )
    assert res.status_code == 422


def test_create_incident_rejects_nonexistent_evidence_id(client: TestClient):
    """Verify that nonexistent evidence IDs trigger 404 without saving partial record."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    res = client.post(
        "/api/v1/incidents",
        json={"title": "Test Incident", "evidence_ids": [fake_uuid]},
    )
    assert res.status_code == 404

    # Verify no incident was created in database
    list_res = client.get("/api/v1/incidents")
    assert list_res.json()["total"] == 0


def test_get_incident_details_and_not_found(client: TestClient):
    """Verify retrieving incident details and standard 404 for missing IDs."""
    ev = upload_test_evidence(client, "audio_transcription.png")
    create_res = client.post(
        "/api/v1/incidents",
        json={"title": "Harassment Campaign", "evidence_ids": [ev["id"]]},
    )
    inc_id = create_res.json()["id"]

    # Valid retrieve
    get_res = client.get(f"/api/v1/incidents/{inc_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == inc_id
    assert data["title"] == "Harassment Campaign"
    assert data["evidence_count"] == 1
    assert data["linked_evidence"][0]["id"] == ev["id"]

    # Nonexistent retrieve
    fake_id = "11111111-2222-3333-4444-555555555555"
    not_found = client.get(f"/api/v1/incidents/{fake_id}")
    assert not_found.status_code == 404


def test_patch_incident_editable_fields(client: TestClient):
    """Verify updating title, description, date, and status."""
    create_res = client.post(
        "/api/v1/incidents",
        json={"title": "Initial Title", "status": "open"},
    )
    inc_id = create_res.json()["id"]
    orig_created = create_res.json()["created_at"]

    patch_res = client.patch(
        f"/api/v1/incidents/{inc_id}",
        json={
            "title": "Updated Title",
            "description": "Added additional case details.",
            "incident_date": "2026-10-17",
            "status": "resolved",
        },
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["title"] == "Updated Title"
    assert data["description"] == "Added additional case details."
    assert data["incident_date"] == "2026-10-17"
    assert data["status"] == "resolved"
    assert data["created_at"] == orig_created
    assert data["updated_at"] >= orig_created


def test_patch_incident_attach_and_detach_evidence(client: TestClient):
    """Verify dynamically linking and unlinking evidence records."""
    ev1 = upload_test_evidence(client, "item1.png")
    ev2 = upload_test_evidence(client, "item2.png")

    # Create incident with ev1
    create_res = client.post(
        "/api/v1/incidents",
        json={"title": "Multi-Evidence Incident", "evidence_ids": [ev1["id"]]},
    )
    inc_id = create_res.json()["id"]
    assert create_res.json()["evidence_count"] == 1

    # Attach ev2 as well
    attach_res = client.patch(
        f"/api/v1/incidents/{inc_id}",
        json={"evidence_ids": [ev1["id"], ev2["id"]]},
    )
    assert attach_res.status_code == 200
    assert attach_res.json()["evidence_count"] == 2
    attached_ids = {e["id"] for e in attach_res.json()["linked_evidence"]}
    assert attached_ids == {ev1["id"], ev2["id"]}

    # Detach ev1 (leaving only ev2)
    detach_res = client.patch(
        f"/api/v1/incidents/{inc_id}",
        json={"evidence_ids": [ev2["id"]]},
    )
    assert detach_res.status_code == 200
    assert detach_res.json()["evidence_count"] == 1
    assert detach_res.json()["linked_evidence"][0]["id"] == ev2["id"]

    # Detach all
    clear_res = client.patch(
        f"/api/v1/incidents/{inc_id}",
        json={"evidence_ids": []},
    )
    assert clear_res.status_code == 200
    assert clear_res.json()["evidence_count"] == 0
    assert clear_res.json()["linked_evidence"] == []


def test_patch_incident_rejects_empty_title_and_invalid_evidence(client: TestClient):
    """Verify atomic rejection of invalid updates."""
    create_res = client.post(
        "/api/v1/incidents",
        json={"title": "Solid Title"},
    )
    inc_id = create_res.json()["id"]

    # Reject empty title
    res_blank = client.patch(f"/api/v1/incidents/{inc_id}", json={"title": "  "})
    assert res_blank.status_code == 422

    # Reject nonexistent evidence ID
    res_fake_ev = client.patch(
        f"/api/v1/incidents/{inc_id}",
        json={"evidence_ids": ["99999999-9999-9999-9999-999999999999"]},
    )
    assert res_fake_ev.status_code == 404

    # Ensure title remained untouched
    detail = client.get(f"/api/v1/incidents/{inc_id}").json()
    assert detail["title"] == "Solid Title"


def test_list_incidents_pagination_and_filtering(client: TestClient):
    """Verify limit, offset, status filter, and search filter."""
    client.post("/api/v1/incidents", json={"title": "Blackmail Case Alpha", "status": "open"})
    client.post("/api/v1/incidents", json={"title": "Threat Note Beta", "status": "documented"})
    client.post("/api/v1/incidents", json={"title": "Case Gamma Resolved", "status": "resolved"})

    # All items
    res_all = client.get("/api/v1/incidents")
    assert res_all.json()["total"] == 3
    assert len(res_all.json()["items"]) == 3

    # Status filter
    res_open = client.get("/api/v1/incidents?status=open")
    assert res_open.json()["total"] == 1
    assert res_open.json()["items"][0]["title"] == "Blackmail Case Alpha"

    # Invalid status filter
    res_bad_status = client.get("/api/v1/incidents?status=not_a_valid_status")
    assert res_bad_status.status_code == 422

    # Search filter
    res_search = client.get("/api/v1/incidents?search=beta")
    assert res_search.json()["total"] == 1
    assert res_search.json()["items"][0]["title"] == "Threat Note Beta"

    # Pagination: limit 1, offset 1
    res_page = client.get("/api/v1/incidents?limit=1&offset=1")
    assert res_page.json()["total"] == 3
    assert len(res_page.json()["items"]) == 1


def test_delete_incident_safety_preserves_evidence(client: TestClient, test_db_session: Session):
    """CRITICAL SECURITY/PRESERVATION TEST:
    Proves that deleting an incident:
    1. Removes the Incident database record.
    2. Removes the IncidentEvidence association link rows.
    3. NEVER deletes the associated Evidence row in the database.
    4. NEVER deletes the physical evidence file from storage on disk.
    """
    # 1. Upload evidence file
    ev = upload_test_evidence(client, "critical_evidence_file.png")
    ev_id = ev["id"]

    # Verify physical file exists on disk
    ev_record = test_db_session.scalar(select(Evidence).where(Evidence.id == ev_id))
    assert ev_record is not None
    file_path = get_absolute_path(ev_record.storage_key)
    assert os.path.isfile(file_path)

    # 2. Create incident and link evidence
    inc_res = client.post(
        "/api/v1/incidents",
        json={"title": "Incident to be deleted", "evidence_ids": [ev_id]},
    )
    inc_id = inc_res.json()["id"]

    # Verify association exists in database
    links = test_db_session.scalars(
        select(IncidentEvidence).where(IncidentEvidence.incident_id == inc_id)
    ).all()
    assert len(links) == 1
    assert links[0].evidence_id == ev_id

    # 3. Delete the incident
    del_res = client.delete(f"/api/v1/incidents/{inc_id}")
    assert del_res.status_code == 200
    del_data = del_res.json()
    assert del_data["deleted"] is True
    assert del_data["id"] == inc_id

    # 4. Verify incident is gone
    assert client.get(f"/api/v1/incidents/{inc_id}").status_code == 404

    # 5. Verify incident_evidence association rows are gone
    remaining_links = test_db_session.scalars(
        select(IncidentEvidence).where(IncidentEvidence.incident_id == inc_id)
    ).all()
    assert len(remaining_links) == 0

    # 6. CRITICAL: Verify Evidence database record still exists!
    surviving_ev = test_db_session.scalar(select(Evidence).where(Evidence.id == ev_id))
    assert surviving_ev is not None
    assert surviving_ev.id == ev_id
    assert surviving_ev.original_filename == "critical_evidence_file.png"

    # 7. CRITICAL: Verify physical storage file on disk is still intact!
    assert os.path.isfile(file_path)
    with open(file_path, "rb") as f:
        content = f.read()
    assert len(content) > 0


def test_delete_nonexistent_incident_returns_404(client: TestClient):
    """Verify deleting a nonexistent incident returns 404."""
    res = client.delete("/api/v1/incidents/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404
