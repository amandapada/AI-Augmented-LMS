"""Student RAG chat service (CH-1..CH-6)."""

from __future__ import annotations

import json
from typing import List

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import NotFoundError, ValidationError
from app.core.rate_limit import RateLimiter
from app.models.chat import ChatMessage
from app.models.handout import Handout, ProcessingStatus
from app.repositories.chat_repo import ChatMessageRepository, ChatSessionRepository
from app.repositories.handout_repo import HandoutRepository
from app.schemas.chat import ChatAnswerResponse, ChatSource
from app.services.ai.rag_service import Chunk, RAGService


class ChatService:
    """Answers student questions grounded in a single handout."""

    def __init__(
        self,
        db: Session,
        rag: RAGService,
        limiter: RateLimiter,
        settings: Settings,
    ) -> None:
        self._db = db
        self._sessions = ChatSessionRepository(db)
        self._messages = ChatMessageRepository(db)
        self._handouts = HandoutRepository(db)
        self._rag = rag
        self._limiter = limiter
        self._settings = settings

    # ---- Ask ----

    def ask(self, *, user_id: int, handout_id: int, question: str) -> ChatAnswerResponse:
        """Enforce rate limit, retrieve, answer, and persist the turn (CH-6, CH-4)."""
        self._limiter.check(
            f"chat:{user_id}",
            limit=self._settings.CHAT_RATE_LIMIT_PER_MINUTE,
            window_seconds=60,
        )

        handout = self._require_approved_handout(handout_id)
        session = self._sessions.get_or_create(user_id=user_id, handout_id=handout.id)

        chunks = self._rag.chunk_text(handout.extracted_text or "")
        result = self._rag.answer(question, chunks)

        sources = [
            ChatSource(text=c.text, page_number=c.page_number) for c in result.sources
        ]

        # Persist both the student's question and the assistant reply so the
        # front-end can render history on reload (CH-5).
        self._messages.add(
            ChatMessage(session_id=session.id, role="user", content=question),
            commit=False,
        )
        self._messages.add(
            ChatMessage(
                session_id=session.id,
                role="assistant",
                content=result.answer,
                sources_json=json.dumps([s.model_dump() for s in sources]),
            ),
            commit=False,
        )
        self._db.commit()

        return ChatAnswerResponse(answer=result.answer, sources=sources)

    # ---- History ----

    def history(self, *, user_id: int, handout_id: int) -> List[ChatMessage]:
        session = self._sessions.get_or_create(user_id=user_id, handout_id=handout_id)
        return self._messages.list_for_session(session.id)

    # ---- helpers ----

    def _require_approved_handout(self, handout_id: int) -> Handout:
        handout = self._handouts.get(handout_id)
        if handout is None:
            raise NotFoundError(f"Handout {handout_id} not found")
        # SEC-5: students only reach chat through approved handouts.
        if handout.status != ProcessingStatus.APPROVED:
            raise ValidationError(
                "This handout is not available to students yet.",
                details={"status": handout.status.value},
            )
        if not handout.extracted_text:
            raise ValidationError("Handout has no extracted text.")
        return handout
