"""Flashcards: generation + spaced repetition (FC-1..FC-6)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.handout import Handout, ProcessingStatus
from app.models.study import Flashcard, FlashcardReview, ReviewDifficulty
from app.repositories.flashcard_repo import FlashcardRepository, FlashcardReviewRepository
from app.repositories.handout_repo import HandoutRepository
from app.services.ai.llm_service import LLMService


@dataclass
class NextReview:
    """Result of :meth:`SpacedRepetitionScheduler.schedule`."""

    interval_days: int
    ease_factor: float
    due_at: datetime


class SpacedRepetitionScheduler:
    """Simplified SM-2-style scheduler.

    Kept separate so its logic is unit-testable without a database. The
    outputs are interval (days) + ease factor; :class:`FlashcardService`
    persists them on a :class:`FlashcardReview`.
    """

    MIN_EASE = 1.3
    STARTING_EASE = 2.5

    def schedule(
        self, prev: FlashcardReview | None, difficulty: ReviewDifficulty, *, now: datetime | None = None
    ) -> NextReview:
        now = now or datetime.utcnow()
        ease = prev.ease_factor if prev else self.STARTING_EASE
        last_interval = prev.interval_days if prev else 0

        if difficulty is ReviewDifficulty.HARD:
            # Hard ratings lower ease and reset interval to 1 day.
            ease = max(self.MIN_EASE, ease - 0.2)
            interval = 1
        elif difficulty is ReviewDifficulty.GOOD:
            # Good ratings keep ease, grow interval geometrically.
            interval = max(1, round(last_interval * ease)) if last_interval else 1
        else:  # EASY
            ease = ease + 0.15
            interval = max(2, round(max(last_interval, 1) * ease * 1.3))

        return NextReview(
            interval_days=interval,
            ease_factor=round(ease, 4),
            due_at=now + timedelta(days=interval),
        )


class FlashcardService:
    """Top-level orchestrator for flashcard workflows."""

    def __init__(self, db: Session, llm: LLMService) -> None:
        self._db = db
        self._cards = FlashcardRepository(db)
        self._reviews = FlashcardReviewRepository(db)
        self._handouts = HandoutRepository(db)
        self._llm = llm
        self._scheduler = SpacedRepetitionScheduler()

    # ---- Generation (FC-1) ----

    def generate_for_handout(self, handout_id: int) -> List[Flashcard]:
        """Ask the LLM for 10 cards and persist them."""
        handout = self._require_ready_handout(handout_id)
        raw = self._llm.generate_flashcards(handout.extracted_text or "")
        if not raw:
            raise ValidationError("Flashcard generation returned no cards.")

        cards = [
            Flashcard(handout_id=handout.id, question=item["question"], answer=item["answer"])
            for item in raw
        ]
        self._db.add_all(cards)
        self._db.commit()
        for c in cards:
            self._db.refresh(c)
        return cards

    def list_for_handout(self, handout_id: int) -> List[Flashcard]:
        return self._cards.list_for_handout(handout_id)

    def due_today(self, *, user_id: int, handout_id: int) -> List[Flashcard]:
        return self._cards.due_for_user(user_id, handout_id)

    # ---- Review (FC-3, FC-4) ----

    def record_review(
        self, *, flashcard_id: int, user_id: int, difficulty: ReviewDifficulty
    ) -> FlashcardReview:
        """Persist a self-rating and schedule the next review."""
        card = self._cards.get(flashcard_id)
        if card is None:
            raise NotFoundError(f"Flashcard {flashcard_id} not found")

        prev = self._reviews.latest_for(user_id, flashcard_id)
        plan = self._scheduler.schedule(prev, difficulty)

        review = FlashcardReview(
            flashcard_id=flashcard_id,
            user_id=user_id,
            difficulty=difficulty,
            interval_days=plan.interval_days,
            ease_factor=plan.ease_factor,
            due_at=plan.due_at,
        )
        self._reviews.add(review)
        return review

    # ---- helpers ----

    def _require_ready_handout(self, handout_id: int) -> Handout:
        handout = self._handouts.get(handout_id)
        if handout is None:
            raise NotFoundError(f"Handout {handout_id} not found")
        if handout.status not in {ProcessingStatus.READY, ProcessingStatus.APPROVED}:
            raise ValidationError(
                "Handout is not ready yet.", details={"status": handout.status.value}
            )
        if not handout.extracted_text:
            raise ValidationError("Handout has no extracted text to generate cards from.")
        return handout
