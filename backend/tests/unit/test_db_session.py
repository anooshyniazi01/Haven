"""Unit tests for database session and health verification."""

from unittest.mock import patch
from app.db.session import check_db_health


def test_check_db_health_success():
    """Verify check_db_health returns True when database is responding."""
    result = check_db_health()
    assert result is True


def test_check_db_health_failure():
    """Verify check_db_health returns False gracefully when connection raises."""
    with patch("app.db.session.engine.connect", side_effect=Exception("Connection refused")):
        result = check_db_health()
        assert result is False
