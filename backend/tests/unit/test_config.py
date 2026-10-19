"""Unit tests for configuration validation."""

from app.core.config import Settings


def test_default_settings():
    s = Settings()
    assert s.APP_ENV in ("development", "production", "test")
    assert s.API_PORT > 0
    assert s.MAX_UPLOAD_SIZE_MB > 0
    assert s.DATABASE_URL.startswith("sqlite")
    assert s.STORAGE_ROOT != ""


def test_settings_override():
    s = Settings(
        APP_ENV="test",
        MAX_UPLOAD_SIZE_MB=50,
        LOG_LEVEL="DEBUG",
    )
    assert s.APP_ENV == "test"
    assert s.MAX_UPLOAD_SIZE_MB == 50
    assert s.LOG_LEVEL == "DEBUG"
