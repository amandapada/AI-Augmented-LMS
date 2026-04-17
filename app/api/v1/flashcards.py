"""Flashcard endpoints (FC-1..FC-5)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_flashcard_service, require_role
from app.models.user import User, UserRole
from app.schemas.study import (
    FlashcardGenerateResponse,
    FlashcardOut,
    FlashcardReviewRequest,
    FlashcardReviewResponse,
)
from app.services.flashcard_service import FlashcardService

router = APIRouter(tags=["flashcards"])


@router.post(
    "/handouts/{handout_id}/generate-flashcards",
    response_model=FlashcardGenerateResponse,
)
def generate(
    handout_id: int,
    service: FlashcardService = Depends(get_flashcard_service),
    _user: User = Depends(require_role(UserRole.LECTURER, UserRole.ADMIN)),
):
    """Generate and persist 10 flashcards for a handout (FC-1)."""
    cards = service.generate_for_handout(handout_id)
    return FlashcardGenerateResponse(
        count=len(cards),
        flashcards=[FlashcardOut.model_validate(c) for c in cards],
    )


@router.get("/handouts/{handout_id}/flashcards", response_model=List[FlashcardOut])
def list_cards(
    handout_id: int,
    service: FlashcardService = Depends(get_flashcard_service),
    _user: User = Depends(get_current_user),
):
    """Return all flashcards belonging to a handout."""
    return [FlashcardOut.model_validate(c) for c in service.list_for_handout(handout_id)]


@router.get("/handouts/{handout_id}/flashcards/due", response_model=List[FlashcardOut])
def due_today(
    handout_id: int,
    service: FlashcardService = Depends(get_flashcard_service),
    user: User = Depends(get_current_user),
):
    """Cards due for review today for the calling student (FC-5)."""
    cards = service.due_today(user_id=user.id, handout_id=handout_id)
    return [FlashcardOut.model_validate(c) for c in cards]


@router.post("/flashcards/{flashcard_id}/review", response_model=FlashcardReviewResponse)
def submit_review(
    flashcard_id: int,
    payload: FlashcardReviewRequest,
    service: FlashcardService = Depends(get_flashcard_service),
    user: User = Depends(get_current_user),
):
    """Record a self-rating and schedule the next review (FC-3, FC-4)."""
    review = service.record_review(
        flashcard_id=flashcard_id, user_id=user.id, difficulty=payload.difficulty
    )
    return FlashcardReviewResponse(
        flashcard_id=review.flashcard_id,
        difficulty=review.difficulty,
        interval_days=review.interval_days,
        due_at=review.due_at,
    )
