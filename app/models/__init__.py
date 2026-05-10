"""SQLAlchemy ORM models grouped by aggregate.

Importing this package registers every model class onto ``Base.metadata``
so that ``create_all`` / Alembic autogenerate can see them.
"""

from app.models.user import User, UserRole
from app.models.handout import ContentChunk, Handout, ProcessingStatus, Topic
from app.models.study import (
    Flashcard,
    FlashcardReview,
    Quiz,
    QuizAttempt,
    ReviewDifficulty,
)
from app.models.chat import ChatMessage, ChatSession
from app.models.analytics import AnalyticsSnapshot

__all__ = [
    "User",
    "UserRole",
    "Handout",
    "Topic",
    "ContentChunk",
    "ProcessingStatus",
    "Flashcard",
    "FlashcardReview",
    "Quiz",
    "QuizAttempt",
    "ReviewDifficulty",
    "ChatSession",
    "ChatMessage",
    "AnalyticsSnapshot",
]
