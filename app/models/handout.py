"""Handout aggregate: uploaded file, processing state, extracted content, topics."""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProcessingStatus(str, enum.Enum):
    """State machine for handout processing (UP-3).

    UPLOADED → PROCESSING → READY → APPROVED is the happy path.
    Any stage can transition to FAILED.
    """

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    APPROVED = "approved"
    FAILED = "failed"


class Handout(Base):
    """A lecturer-uploaded study document."""

    __tablename__ = "handouts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Uploader — used for authorization and ownership checks.
    uploader_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String, nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[ProcessingStatus] = mapped_column(
        SQLEnum(ProcessingStatus, name="processing_status"),
        default=ProcessingStatus.UPLOADED,
        nullable=False,
        index=True,
    )
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Overall page-weighted confidence. Individual chunks carry their own scores.
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Populated on FAILED to help the lecturer understand why (UP-6).
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    topics: Mapped[list["Topic"]] = relationship(
        back_populates="handout", cascade="all, delete-orphan"
    )
    chunks: Mapped[list["ContentChunk"]] = relationship(
        back_populates="handout", cascade="all, delete-orphan"
    )


class Topic(Base):
    """AI-suggested (and lecturer-editable) topic tag on a handout (AUD-4)."""

    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    handout_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("handouts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)

    handout: Mapped[Handout] = relationship(back_populates="topics")


class ContentChunk(Base):
    """A retrievable slice of extracted handout text (used for RAG).

    The ``embedding`` column is typed :class:`pgvector.sqlalchemy.Vector` when
    the pgvector extension is available. We fall back to TEXT if not — the
    RAG service treats both paths transparently.
    """

    __tablename__ = "content_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    handout_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("handouts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # Stored as JSON-encoded list of floats for portability. When pgvector is
    # enabled a future migration swaps this to ``Vector(dim)``.
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Confidence drives the red-highlight UI (AUD-2).
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)

    handout: Mapped[Handout] = relationship(back_populates="chunks")
