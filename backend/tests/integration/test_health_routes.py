"""Integration tests for health and application readiness endpoints."""

from unittest.mock import patch
from fastapi.testclient import TestClient


def test_get_health(client: TestClient):
    """GET /health must return 200 OK with status: ok and no internal leakage."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "ok"}
    # Verify no leaks of environment, secrets, or internal paths
    assert "database" not in data
    assert "storage" not in data
    assert "path" not in data


def test_get_system_status_ready(client: TestClient):
    """GET /api/v1/status must return 200 with ready and connected components."""
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"
    assert data["analysis_engine"] == "available"


def test_get_system_status_degraded_when_db_down(client: TestClient):
    """GET /api/v1/status must reflect actual degraded state if database is unavailable."""
    with patch("app.api.routes.health.check_db_health", return_value=False):
        response = client.get("/api/v1/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"
        assert data["analysis_engine"] == "available"


def test_not_found_error_structure(client: TestClient):
    """Unknown route must return standardized 404 error response format."""
    response = client.get("/api/v1/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
    assert "message" in data["error"]
