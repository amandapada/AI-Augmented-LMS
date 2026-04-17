"""Analytics dashboard service (AN-1..AN-4).

Reads are served from a cache (``analytics_snapshots`` + optional Redis TTL)
so the dashboard stays snappy even as the underlying tables grow.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Protocol

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.repositories.analytics_repo import AnalyticsRepository
from app.schemas.analytics import (
    AnalyticsOverview,
    FeatureUsage,
    QuizTrendPoint,
    StudentImprovement,
    WeakestTopic,
)


class _RedisLike(Protocol):
    def get(self, key: str): ...  # pragma: no cover
    def setex(self, key: str, seconds: int, value): ...  # pragma: no cover


class AnalyticsService:
    """Compose raw aggregates into the dashboard DTO, with caching."""

    CACHE_KEY = "analytics:overview"

    def __init__(self, db: Session, redis_client: _RedisLike, settings: Settings) -> None:
        self._db = db
        self._repo = AnalyticsRepository(db)
        self._redis = redis_client
        self._settings = settings

    # ---- Public API ----

    def overview(self, *, force_refresh: bool = False) -> AnalyticsOverview:
        """Return the full dashboard payload.

        Cache strategy:
          1. Redis TTL cache — fastest, used by every request.
          2. DB snapshot — survives Redis evictions.
          3. Fresh compute — on cold cache or ``force_refresh``.
        """
        if not force_refresh:
            hit = self._redis.get(self.CACHE_KEY)
            if hit is not None:
                payload = hit.decode() if isinstance(hit, (bytes, bytearray)) else hit
                return AnalyticsOverview(**json.loads(payload))

            snap = self._repo.get_snapshot(self.CACHE_KEY)
            if snap is not None:
                return AnalyticsOverview(**json.loads(snap.payload_json))

        overview = self._compute_overview()
        serialized = overview.model_dump_json()
        self._redis.setex(self.CACHE_KEY, self._settings.ANALYTICS_CACHE_SECONDS, serialized)
        self._repo.upsert_snapshot(self.CACHE_KEY, serialized)
        return overview

    # ---- Composition ----

    def _compute_overview(self) -> AnalyticsOverview:
        trends = [
            QuizTrendPoint(day=day, avg_score=avg, attempts=count)
            for (day, avg, count) in self._repo.quiz_trends(days=30)
        ]
        weakest = [
            WeakestTopic(topic=name, avg_score=avg, attempts=count)
            for (name, avg, count) in self._repo.weakest_topics(limit=10)
        ]
        usage = FeatureUsage(**self._repo.feature_usage())
        first, latest = self._repo.student_improvement()
        improvement = StudentImprovement(
            first_week_avg=first,
            latest_week_avg=latest,
            delta=(latest - first) if (first is not None and latest is not None) else None,
        )
        return AnalyticsOverview(
            quiz_trends=trends,
            weakest_topics=weakest,
            feature_usage=usage,
            student_improvement=improvement,
            refreshed_at=datetime.utcnow().isoformat(),
        )
