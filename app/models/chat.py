"""Chat aggregate: per-student RAG conversations bound to a handout."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ChatSession(Base):
    """A chat thread scoped to one handout + one user (CH-5)."""

    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    handout_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("handouts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )


class ChatMessage(Base):
    """Single turn inside a :class:`ChatSession` (student question or assistant reply)."""

    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # "user" or "assistant" — matches OpenAI/Groq chat format so we can
    # replay history straight into the LLM when we add memory.
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # JSON-encoded list of {text, page_number} dicts the assistant cited (CH-4).
    sources_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    session: Mapped[ChatSession] = relationship(back_populates="messages")
