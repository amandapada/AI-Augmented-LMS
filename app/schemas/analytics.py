"""Analytics dashboard DTOs (AN-1..AN-4)."""

from __future__ import annotations

from datetime import date
from typing import Dict, List

from pydantic import BaseModel


class QuizTrendPoint(BaseModel):
    day: date
    avg_score: float
    attempts: int


class WeakestTopic(BaseModel):
    topic: str
    avg_score: float
    attempts: int


class FeatureUsage(BaseModel):
    """Counts of flashcard reviews vs quiz attempts vs chat messages (AN-3)."""

    flashcards: int
    quizzes: int
    chats: int


class StudentImprovement(BaseModel):
    """First-week vs latest-week averages (AN-4)."""

    first_week_avg: float | None
    latest_week_avg: float | None
    delta: float | None


class AnalyticsOverview(BaseModel):
    quiz_trends: List[QuizTrendPoint]
    weakest_topics: List[WeakestTopic]
    feature_usage: FeatureUsage
    student_improvement: StudentImprovement
    refreshed_at: str
