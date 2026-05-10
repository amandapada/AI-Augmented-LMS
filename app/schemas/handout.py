"""Handout-related request/response DTOs."""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from app.models.handout import ProcessingStatus


class HandoutUploadResponse(BaseModel):
    """Returned by POST /handouts/upload."""

    id: int
    status: ProcessingStatus
    message: str


class HandoutStatusResponse(BaseModel):
    """Returned by GET /handouts/{id}/status (UP-3)."""

    id: int
    title: str
    status: ProcessingStatus
    error_message: str | None = None


class TopicOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class ContentChunkOut(BaseModel):
    """A chunk of extracted text, with its confidence so the UI can colour it (AUD-2)."""

    id: int
    text: str
    confidence: float
    page_number: int | None = None

    model_config = {"from_attributes": True}


class HandoutDetail(BaseModel):
    """Full handout payload — drives the audit screen (AUD-1)."""

    id: int
    title: str
    file_url: str
    status: ProcessingStatus
    extracted_text: str | None = None
    confidence: float | None = None
    topics: List[TopicOut] = []
    chunks: List[ContentChunkOut] = []
    created_at: datetime
    approved_at: datetime | None = None

    model_config = {"from_attributes": True}


class HandoutSummary(BaseModel):
    """Condensed handout — used in list endpoints for lecturers/students."""

    id: int
    title: str
    status: ProcessingStatus
    created_at: datetime
    approved_at: datetime | None = None

    model_config = {"from_attributes": True}


class AuditUpdateRequest(BaseModel):
    """Payload for PATCH /handouts/{id}/audit (AUD-3, AUD-4)."""

    extracted_text: str | None = None
    topics: List[str] | None = Field(
        default=None,
        description="Replaces the full topic list; send all tags the lecturer wants to keep.",
    )


class ApproveResponse(BaseModel):
    id: int
    status: ProcessingStatus
    approved_at: datetime
