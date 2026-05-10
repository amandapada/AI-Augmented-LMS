"""Queries for chat sessions + messages."""

from __future__ import annotations

from typing import List

from app.models.chat import ChatMessage, ChatSession
from app.repositories.base import BaseRepository


class ChatSessionRepository(BaseRepository[ChatSession]):
    model = ChatSession

    def get_or_create(self, *, user_id: int, handout_id: int) -> ChatSession:
        """Fetch the user's session for this handout, creating one if missing."""
        session = (
            self.db.query(ChatSession)
            .filter(ChatSession.user_id == user_id, ChatSession.handout_id == handout_id)
            .one_or_none()
        )
        if session is None:
            session = ChatSession(user_id=user_id, handout_id=handout_id)
            self.db.add(session)
            self.db.flush()
        return session


class ChatMessageRepository(BaseRepository[ChatMessage]):
    model = ChatMessage

    def list_for_session(self, session_id: int) -> List[ChatMessage]:
        return (
            self.db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
