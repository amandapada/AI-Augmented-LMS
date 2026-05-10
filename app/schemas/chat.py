"""Chat DTOs (RAG)."""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class ChatSource(BaseModel):
    """Citation returned alongside an answer (CH-4)."""

    text: str
    page_number: int | None = None


class ChatAskRequest(BaseModel):
    """POST /handouts/{id}/chat body."""

    question: str = Field(min_length=1, max_length=2000)


class ChatAnswerResponse(BaseModel):
    answer: str
    sources: List[ChatSource]


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
