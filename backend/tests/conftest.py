"""Shared test fixtures for Haven backend tests."""

import os
import tempfile
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app


@pytest.fixture(scope="session")
def temp_db_file() -> Generator[str, None, None]:
    """Provide a temporary database file path for tests."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    yield db_path
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except OSError:
            pass


@pytest.fixture(scope="function")
def temp_storage_dir(monkeypatch: pytest.MonkeyPatch) -> Generator[str, None, None]:
    """Provide an isolated temporary storage root directory for each test."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        monkeypatch.setattr(settings, "STORAGE_ROOT", tmp_dir)
        yield tmp_dir


@pytest.fixture(scope="function")
def test_db_session(temp_db_file: str) -> Generator[Session, None, None]:
    """Provide an isolated test database session with all tables created."""
    test_db_url = f"sqlite:///{temp_db_file}"
    engine = create_engine(
        test_db_url,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture(scope="function")
def client(
    test_db_session: Session, temp_storage_dir: str
) -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient with database session and storage overridden."""
    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        yield test_db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
