"""Queries for flashcards and their per-student reviews."""

from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import and_

from app.models.study import Flashcard, FlashcardReview
from app.repositories.base import BaseRepository


class FlashcardRepository(BaseRepository[Flashcard]):
    model = Flashcard

    def list_for_handout(self, handout_id: int) -> List[Flashcard]:
        return self.db.query(Flashcard).filter(Flashcard.handout_id == handout_id).all()

    def due_for_user(
        self, user_id: int, handout_id: int, *, now: datetime | None = None
    ) -> List[Flashcard]:
        """Return flashcards due for review by this user (FC-5).

        A card is "due" if:
          - the user has never reviewed it, OR
          - the latest review's ``due_at`` is in the past.
        """
        now = now or datetime.utcnow()
        # Latest review per (flashcard, user) — correlated subquery.
        latest_review = (
            self.db.query(FlashcardReview)
            .filter(FlashcardReview.user_id == user_id)
            .order_by(FlashcardReview.reviewed_at.desc())
            .subquery()
        )
        return (
            self.db.query(Flashcard)
            .outerjoin(
                latest_review,
                and_(
                    latest_review.c.flashcard_id == Flashcard.id,
                    latest_review.c.user_id == user_id,
                ),
            )
            .filter(Flashcard.handout_id == handout_id)
            .filter((latest_review.c.due_at.is_(None)) | (latest_review.c.due_at <= now))
            .all()
        )


class FlashcardReviewRepository(BaseRepository[FlashcardReview]):
    model = FlashcardReview

    def latest_for(self, user_id: int, flashcard_id: int) -> FlashcardReview | None:
        """Return the student's most-recent review of a card, or ``None`` if never reviewed."""
        return (
            self.db.query(FlashcardReview)
            .filter(
                FlashcardReview.user_id == user_id,
                FlashcardReview.flashcard_id == flashcard_id,
            )
            .order_by(FlashcardReview.reviewed_at.desc())
            .first()
        )

    def count_for_user_since(self, user_id: int, since: datetime) -> int:
        """Number of reviews a user has done since ``since`` — used for analytics."""
        return (
            self.db.query(FlashcardReview)
            .filter(FlashcardReview.user_id == user_id, FlashcardReview.reviewed_at >= since)
            .count()
        )
