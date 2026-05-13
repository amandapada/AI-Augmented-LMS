"""Chat DTOs (RAG)."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, List

from pydantic import BaseModel, Field, model_validator


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
    sources: List[ChatSource] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def _coerce_orm(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        raw = getattr(data, "sources_json", None) or ""
        parsed: List[Any] = []
        if isinstance(raw, str) and raw.strip():
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = []
        if not isinstance(parsed, list):
            parsed = []
        sources_in: List[Any] = []
        for item in parsed:
            if isinstance(item, dict):
                sources_in.append(item)
        return {
            "id": data.id,
            "role": data.role,
            "content": data.content,
            "created_at": data.created_at,
            "sources": sources_in,
        }
