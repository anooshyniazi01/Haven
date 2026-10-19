"""Evidence SQLAlchemy model conforming to docs/DATABASE_SCHEMA.md."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Evidence(Base):
    """Represents a file or artifact preserved in the Evidence Vault."""

    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    analysis_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type_detected: Mapped[str] = mapped_column(String(100), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    analysis: Mapped["Analysis | None"] = relationship(
        "Analysis", back_populates="evidence_records"
    )

    incident_links: Mapped[list["IncidentEvidence"]] = relationship(
        "IncidentEvidence", back_populates="evidence", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_evidence_created_at", "created_at"),
        Index("idx_evidence_analysis_id", "analysis_id"),
    )
