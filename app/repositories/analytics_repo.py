"""Aggregations used by the analytics dashboard."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from sqlalchemy import func

from app.models.chat import ChatMessage
from app.models.handout import Topic
from app.models.study import FlashcardReview, Quiz, QuizAttempt
from app.models.analytics import AnalyticsSnapshot
from app.repositories.base import BaseRepository


class AnalyticsRepository(BaseRepository[AnalyticsSnapshot]):
    """Heavy read-only aggregates.

    Results here are expensive enough that we cache them in the
    ``analytics_snapshots`` table (SCAL-2).
    """

    model = AnalyticsSnapshot

    # ---- Snapshot cache helpers ----

    def get_snapshot(self, metric: str) -> AnalyticsSnapshot | None:
        return (
            self.db.query(AnalyticsSnapshot)
            .filter(AnalyticsSnapshot.metric == metric)
            .one_or_none()
        )

    def upsert_snapshot(self, metric: str, payload_json: str) -> AnalyticsSnapshot:
        """Insert-or-update a metric snapshot keyed by name."""
        snap = self.get_snapshot(metric)
        if snap is None:
            snap = AnalyticsSnapshot(metric=metric, payload_json=payload_json)
            self.db.add(snap)
        else:
            snap.payload_json = payload_json
            snap.refreshed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(snap)
        return snap

    # ---- Underlying aggregates ----

    def quiz_trends(self, *, days: int = 30) -> List[Tuple[datetime, float, int]]:
        """Return (day, avg_score, attempt_count) per day for the last ``days`` days."""
        since = datetime.utcnow() - timedelta(days=days)
        rows = (
            self.db.query(
                func.date(QuizAttempt.submitted_at).label("day"),
                func.avg(QuizAttempt.score).label("avg_score"),
                func.count(QuizAttempt.id).label("attempts"),
            )
            .filter(QuizAttempt.submitted_at >= since)
            .group_by("day")
            .order_by("day")
            .all()
        )
        return [(r.day, float(r.avg_score or 0), int(r.attempts)) for r in rows]

    def weakest_topics(self, *, limit: int = 10) -> List[Tuple[str, float, int]]:
        """Return (topic_name, avg_score, attempts) ordered by weakest first.

        Topic-level scoring joins attempts → quiz → handout → topic. A quiz
        whose handout has multiple topics contributes to each topic's average.
        """
        rows = (
            self.db.query(
                Topic.name,
                func.avg(QuizAttempt.score).label("avg_score"),
                func.count(QuizAttempt.id).label("attempts"),
            )
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .join(Topic, Topic.handout_id == Quiz.handout_id)
            .group_by(Topic.name)
            .order_by("avg_score")
            .limit(limit)
            .all()
        )
        return [(r.name, float(r.avg_score or 0), int(r.attempts)) for r in rows]

    def feature_usage(self) -> Dict[str, int]:
        """Total lifetime counts of each study activity (AN-3)."""
        return {
            "flashcards": self.db.query(FlashcardReview).count(),
            "quizzes": self.db.query(QuizAttempt).count(),
            "chats": self.db.query(ChatMessage).filter(ChatMessage.role == "user").count(),
        }

    def student_improvement(self) -> Tuple[float | None, float | None]:
        """Return (first_week_avg, latest_week_avg) across all attempts (AN-4)."""
        first_attempt = (
            self.db.query(func.min(QuizAttempt.submitted_at)).scalar()
        )
        if not first_attempt:
            return (None, None)

        first_week_end = first_attempt + timedelta(days=7)
        latest_week_start = datetime.utcnow() - timedelta(days=7)

        first_avg = (
            self.db.query(func.avg(QuizAttempt.score))
            .filter(QuizAttempt.submitted_at <= first_week_end)
            .scalar()
        )
        latest_avg = (
            self.db.query(func.avg(QuizAttempt.score))
            .filter(QuizAttempt.submitted_at >= latest_week_start)
            .scalar()
        )
        return (
            float(first_avg) if first_avg is not None else None,
            float(latest_avg) if latest_avg is not None else None,
        )
