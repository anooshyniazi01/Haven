"""Analysis SQLAlchemy model conforming to docs/DATABASE_SCHEMA.md."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Analysis(Base):
    """Represents an uploaded media item and its analysis lifecycle."""

    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type_detected: Mapped[str] = mapped_column(String(100), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="uploaded")

    analysis_method: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    result_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    result_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    limitations_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    technical_details_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    evidence_records: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="analysis", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_analyses_created_at", "created_at"),
        Index("idx_analyses_status", "status"),
    )
