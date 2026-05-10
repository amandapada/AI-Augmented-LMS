"""Aggregate router that collects every v1 endpoint under a single prefix."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import analytics, auth, chat, flashcards, handouts, quizzes

api_router = APIRouter()

# Order is cosmetic — it only affects the generated OpenAPI tag order.
api_router.include_router(auth.router)
api_router.include_router(handouts.router)
api_router.include_router(flashcards.router)
api_router.include_router(quizzes.router)
api_router.include_router(chat.router)
api_router.include_router(analytics.router)
