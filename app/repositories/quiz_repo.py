"""Queries for quizzes and quiz attempts."""

from __future__ import annotations

from datetime import datetime
from typing import List

from app.models.study import Quiz, QuizAttempt
from app.repositories.base import BaseRepository


class QuizRepository(BaseRepository[Quiz]):
    model = Quiz

    def list_for_handout(self, handout_id: int) -> List[Quiz]:
        return self.db.query(Quiz).filter(Quiz.handout_id == handout_id).all()


class QuizAttemptRepository(BaseRepository[QuizAttempt]):
    model = QuizAttempt

    def history_for_user(self, user_id: int, *, limit: int = 50) -> List[QuizAttempt]:
        """Return a user's attempts across all quizzes, newest first (QZ-6)."""
        return (
            self.db.query(QuizAttempt)
            .filter(QuizAttempt.user_id == user_id)
            .order_by(QuizAttempt.submitted_at.desc())
            .limit(limit)
            .all()
        )

    def attempts_since(self, since: datetime) -> List[QuizAttempt]:
        """All attempts newer than ``since`` — drives analytics aggregations."""
        return (
            self.db.query(QuizAttempt)
            .filter(QuizAttempt.submitted_at >= since)
            .order_by(QuizAttempt.submitted_at.asc())
            .all()
        )
