"""Background processor that turns an uploaded handout into extracted text.

Lifecycle:
    UPLOADED (API)
        ↓ enqueue
    PROCESSING (worker marks it)
        ↓ download from storage
        ↓ VLM extract
        ↓ persist chunks + full text
    READY   (happy path — lecturer can audit)
    FAILED  (error path — lecturer sees ``error_message``)
"""

from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path

from app.core.config import settings
from app.db.session import SessionFactory
from app.models.handout import ContentChunk, Handout, ProcessingStatus
from app.repositories.handout_repo import ContentChunkRepository, HandoutRepository
from app.services.ai.groq_client import GroqClient
from app.services.ai.vlm_service import ExtractionResult, VLMService
from app.services.queue_service import QueueService
from app.services.storage_service import StorageService
from app.workers.base_worker import BaseWorker
from supabase import create_client
import redis

logger = logging.getLogger(__name__)


class HandoutProcessor(BaseWorker):
    """Consumes ``handout_queue`` and runs the extraction pipeline."""

    def __init__(
        self,
        queue: QueueService,
        storage: StorageService,
        vlm: VLMService,
    ) -> None:
        super().__init__(queue=queue)
        self._storage = storage
        self._vlm = vlm

    # ---- BaseWorker contract ----

    def handle(self, payload: str) -> None:
        """Run one handout through the VLM pipeline.

        Uses its own DB session per job — workers are independent of the
        FastAPI request lifecycle, so we don't share sessions.
        """
        try:
            handout_id = int(payload)
        except ValueError:
            logger.error("Invalid handout_id payload: %r", payload)
            return

        with SessionFactory.session_scope() as db:
            repo = HandoutRepository(db)
            chunk_repo = ContentChunkRepository(db)
            handout = repo.get(handout_id)
            if handout is None:
                logger.warning("Handout %s no longer exists — skipping", handout_id)
                return

            handout.status = ProcessingStatus.PROCESSING
            db.commit()
            try:
                result = self._process_one(handout)
                self._persist_result(db, repo, chunk_repo, handout, result)
            except Exception as exc:
                logger.exception("Extraction failed for handout %s", handout_id)
                handout.status = ProcessingStatus.FAILED
                handout.error_message = str(exc)
                db.commit()

    # ---- Internals ----

    def _process_one(self, handout: Handout) -> ExtractionResult:
        """Download the file from storage and hand it to the VLM."""
        key = self._storage.extract_key_from_url(handout.file_url)
        file_bytes = self._storage.download(key)

        suffix = Path(handout.title).suffix or ".bin"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            return self._vlm.extract(tmp_path)
        finally:
            # Always clean up — tempfile(delete=False) leaks otherwise.
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    def _persist_result(
        self,
        db,
        repo: HandoutRepository,
        chunk_repo: ContentChunkRepository,
        handout: Handout,
        result: ExtractionResult,
    ) -> None:
        """Write extracted text + per-chunk confidence back to the DB."""
        handout.extracted_text = result.full_text or None
        handout.confidence = result.confidence
        if result.error:
            handout.status = ProcessingStatus.FAILED
            handout.error_message = result.error
            db.commit()
            return

        # Replace any previous chunks (reruns overwrite).
        db.query(ContentChunk).filter(ContentChunk.handout_id == handout.id).delete()
        chunk_repo.bulk_add(
            [
                ContentChunk(
                    handout_id=handout.id,
                    text=c.text,
                    confidence=c.confidence,
                    page_number=c.page_number,
                )
                for c in result.chunks
                if c.text
            ]
        )
        handout.status = ProcessingStatus.READY
        db.commit()


def build_default_worker() -> HandoutProcessor:
    """Factory used by the CLI entrypoint (``python -m app.workers``)."""

    redis_client = redis.from_url(settings.UPSTASH_REDIS_URL, decode_responses=False)
    queue = QueueService(redis_client=redis_client)

    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    storage = StorageService(supabase_client=supabase, bucket=settings.SUPABASE_BUCKET)

    groq = GroqClient(
        api_key=settings.GROQ_API_KEY,
        llm_model=settings.GROQ_LLM_MODEL,
        vlm_model=settings.GROQ_VLM_MODEL,
    )
    vlm = VLMService(groq=groq)
    return HandoutProcessor(queue=queue, storage=storage, vlm=vlm)
