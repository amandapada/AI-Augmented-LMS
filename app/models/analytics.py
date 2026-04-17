"""Analytics cache.

We avoid re-computing dashboards on every request (SCAL-2 caps refresh at 1h).
Instead, the AnalyticsService writes a snapshot per ``metric`` key — a JSON
blob that the API returns verbatim.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AnalyticsSnapshot(Base):
    """Materialised view of an analytics metric, refreshed periodically."""

    __tablename__ = "analytics_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    metric: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    refreshed_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
