"""Study-tool aggregates: flashcards + spaced repetition, quizzes + attempts."""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ReviewDifficulty(str, enum.Enum):
    """Self-rating options a student can pick after flipping a flashcard (FC-3)."""

    HARD = "hard"
    GOOD = "good"
    EASY = "easy"


class Flashcard(Base):
    """Auto-generated Q&A card (FC-1)."""

    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    handout_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("handouts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    reviews: Mapped[list["FlashcardReview"]] = relationship(
        back_populates="flashcard", cascade="all, delete-orphan"
    )


class FlashcardReview(Base):
    """Per-student review record feeding the spaced-repetition scheduler (FC-4, FC-5)."""

    __tablename__ = "flashcard_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    flashcard_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    difficulty: Mapped[ReviewDifficulty] = mapped_column(
        SQLEnum(ReviewDifficulty, name="review_difficulty"), nullable=False
    )
    # Next-review bookkeeping (simple SM-2 variant — see SpacedRepetitionScheduler).
    interval_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)

    flashcard: Mapped[Flashcard] = relationship(back_populates="reviews")


class Quiz(Base):
    """Generated quiz for a handout (QZ-1).

    ``questions_json`` holds the full payload (5 MCQ + 2 short-answer). We keep
    it as a single JSON blob because quizzes are always read/written whole;
    breaking it into per-question rows would add joins with no query benefit.
    """

    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    handout_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("handouts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    questions_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    attempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan"
    )


class QuizAttempt(Base):
    """One student's attempt at a quiz (QZ-4, QZ-6, AN-1)."""

    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Raw submission (e.g. {"mcq": ["A","C",...], "short_answer": ["..."]}).
    answers_json: Mapped[str] = mapped_column(Text, nullable=False)
    # Percentage score (0.0–100.0). Short answers are graded heuristically; see QuizService.
    score: Mapped[float] = mapped_column(Float, nullable=False)
    # Per-question breakdown so analytics can compute weakest topics (AN-2).
    breakdown_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )

    quiz: Mapped[Quiz] = relationship(back_populates="attempts")
