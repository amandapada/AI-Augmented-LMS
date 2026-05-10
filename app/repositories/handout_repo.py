"""Queries against handout + topic + chunk tables."""

from __future__ import annotations

from typing import List

from app.models.handout import ContentChunk, Handout, ProcessingStatus, Topic
from app.repositories.base import BaseRepository


class HandoutRepository(BaseRepository[Handout]):
    model = Handout

    def list_approved(self, *, limit: int = 100, offset: int = 0) -> List[Handout]:
        """Return handouts students are allowed to see (status = APPROVED)."""
        return (
            self.db.query(Handout)
            .filter(Handout.status == ProcessingStatus.APPROVED)
            .order_by(Handout.approved_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def list_for_lecturer(self, uploader_id: int) -> List[Handout]:
        """Return every handout owned by a given lecturer."""
        return (
            self.db.query(Handout)
            .filter(Handout.uploader_id == uploader_id)
            .order_by(Handout.created_at.desc())
            .all()
        )

    def replace_topics(self, handout: Handout, names: List[str]) -> List[Topic]:
        """Swap the handout's topic set atomically (AUD-4).

        Deletes the existing Topic rows and inserts the supplied names. We
        deliberately avoid diff-merging — the UI always sends the full list.
        """
        self.db.query(Topic).filter(Topic.handout_id == handout.id).delete()
        new_topics = [Topic(handout_id=handout.id, name=n.strip()) for n in names if n.strip()]
        self.db.add_all(new_topics)
        self.db.flush()
        return new_topics


class ContentChunkRepository(BaseRepository[ContentChunk]):
    model = ContentChunk

    def list_for_handout(self, handout_id: int) -> List[ContentChunk]:
        return (
            self.db.query(ContentChunk)
            .filter(ContentChunk.handout_id == handout_id)
            .order_by(ContentChunk.page_number.asc(), ContentChunk.id.asc())
            .all()
        )

    def bulk_add(self, chunks: List[ContentChunk]) -> None:
        """Insert many chunks in one round-trip (used by the worker)."""
        self.db.add_all(chunks)
        self.db.flush()


class TopicRepository(BaseRepository[Topic]):
    model = Topic
