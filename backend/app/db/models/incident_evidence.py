"""IncidentEvidence association model conforming to docs/DATABASE_SCHEMA.md."""

from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class IncidentEvidence(Base):
    """Many-to-many linking table between Incidents and Evidence."""

    __tablename__ = "incident_evidence"

    incident_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        primary_key=True,
    )
    evidence_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("evidence.id", ondelete="RESTRICT"),
        primary_key=True,
    )
    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    incident: Mapped["Incident"] = relationship(
        "Incident", back_populates="evidence_links"
    )
    evidence: Mapped["Evidence"] = relationship(
        "Evidence", back_populates="incident_links"
    )

    __table_args__ = (
        Index("idx_incident_evidence_evidence_id", "evidence_id"),
    )
