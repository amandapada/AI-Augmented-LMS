"""Analytics endpoints (AN-1..AN-4)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_analytics_service, require_role
from app.models.user import User, UserRole
from app.schemas.analytics import AnalyticsOverview
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def overview(
    force_refresh: bool = Query(default=False, description="Bypass cache and recompute now."),
    service: AnalyticsService = Depends(get_analytics_service),
    _user: User = Depends(require_role(UserRole.LECTURER, UserRole.ADMIN)),
):
    """Full dashboard payload (cached ~1h per SCAL-2)."""
    return service.overview(force_refresh=force_refresh)
