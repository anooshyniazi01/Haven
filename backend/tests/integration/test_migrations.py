"""Integration test verifying Alembic schema migration on SQLite."""

import os
import tempfile
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_alembic_migrations_create_expected_tables():
    """Verify that Alembic migrations run cleanly against a fresh SQLite database."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        temp_db_path = f.name

    try:
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option(
            "sqlalchemy.url", f"sqlite:///{temp_db_path}"
        )

        # Run migration to head
        command.upgrade(alembic_cfg, "head")

        # Inspect resulting SQLite schema
        engine = create_engine(f"sqlite:///{temp_db_path}")
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        assert "analyses" in tables
        assert "evidence" in tables
        assert "incidents" in tables
        assert "incident_evidence" in tables
        assert "alembic_version" in tables

        # Verify analyses columns
        analyses_cols = {col["name"] for col in inspector.get_columns("analyses")}
        expected_analyses_cols = {
            "id",
            "original_filename",
            "storage_key",
            "file_size_bytes",
            "mime_type_detected",
            "sha256",
            "status",
            "analysis_method",
            "model_name",
            "model_version",
            "result_label",
            "result_score",
            "score_type",
            "explanation",
            "limitations_json",
            "error_code",
            "created_at",
            "completed_at",
            "updated_at",
        }
        assert expected_analyses_cols.issubset(analyses_cols)

        engine.dispose()
    finally:
        if os.path.exists(temp_db_path):
            try:
                os.remove(temp_db_path)
            except OSError:
                pass
