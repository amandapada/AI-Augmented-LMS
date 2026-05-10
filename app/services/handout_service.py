"""Lecturer-facing upload + audit + approval orchestration.

All heavy work (VLM extraction) happens asynchronously in the worker; this
service is strictly about coordinating DB writes and dispatching jobs.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import NotFoundError, ValidationError
from app.models.handout import Handout, ProcessingStatus
from app.models.user import User, UserRole
from app.repositories.handout_repo import HandoutRepository
from app.schemas.handout import AuditUpdateRequest
from app.services.queue_service import QueueService
from app.services.storage_service import StorageService


class HandoutService:
    """Owns the lifecycle of a handout record."""

    def __init__(
        self,
        db: Session,
        storage: StorageService,
        queue: QueueService,
        settings: Settings,
    ) -> None:
        self._db = db
        self._repo = HandoutRepository(db)
        self._storage = storage
        self._queue = queue
        self._settings = settings

    # ---- Upload ----

    def upload(
        self,
        *,
        filename: str,
        content: bytes,
        content_type: str,
        uploader: User,
    ) -> Handout:
        """Validate, persist to storage, create DB row, and enqueue processing.

        Enforces SEC-2 (MIME allow-list), SEC-3 (size cap), and UP-3 (initial
        status = UPLOADED).
        """
        self._validate_upload(filename, content, content_type)

        ext = Path(filename).suffix.lstrip(".").lower() or "bin"
        storage_key = f"{uuid.uuid4()}.{ext}"
        uploaded = self._storage.upload(
            key=storage_key, content=content, content_type=content_type
        )

        handout = Handout(
            uploader_id=uploader.id,
            title=filename,
            file_url=uploaded.public_url,
            mime_type=content_type,
            size_bytes=len(content),
            status=ProcessingStatus.UPLOADED,
        )
        self._repo.add(handout)

        # Fire-and-forget: the worker picks this up and flips status to PROCESSING.
        self._queue.enqueue(handout.id)
        return handout

    # ---- Reads ----

    def get(self, handout_id: int) -> Handout:
        handout = self._repo.get(handout_id)
        if handout is None:
            raise NotFoundError(f"Handout {handout_id} not found")
        return handout

    def list_for_viewer(self, user: User) -> List[Handout]:
        """Return handouts visible to ``user``.

        Students see approved handouts only (SEC-5 in spirit; course scoping
        is post-MVP). Lecturers see their own uploads in any state.
        """
        if user.role == UserRole.STUDENT:
            return self._repo.list_approved()
        return self._repo.list_for_lecturer(user.id)

    # ---- Audit ----

    def update_audit(self, handout_id: int, payload: AuditUpdateRequest) -> Handout:
        """Apply lecturer edits to extracted text and/or topics (AUD-3, AUD-4)."""
        handout = self.get(handout_id)
        if payload.extracted_text is not None:
            handout.extracted_text = payload.extracted_text
        if payload.topics is not None:
            self._repo.replace_topics(handout, payload.topics)
        self._repo.update(handout)
        return handout

    # ---- Approval ----

    def approve(self, handout_id: int) -> Handout:
        """Mark a handout visible to students (AUD-5)."""
        handout = self.get(handout_id)
        if handout.status not in {ProcessingStatus.READY, ProcessingStatus.APPROVED}:
            raise ValidationError(
                f"Cannot approve handout in status {handout.status.value}",
                details={"status": handout.status.value},
            )
        handout.status = ProcessingStatus.APPROVED
        handout.approved_at = datetime.utcnow()
        self._repo.update(handout)
        return handout

    # ---- Validation ----

    def _validate_upload(self, filename: str, content: bytes, content_type: str) -> None:
        if content_type not in self._settings.ALLOWED_MIME_TYPES:
            raise ValidationError(
                f"Unsupported file type: {content_type}",
                details={"allowed": self._settings.ALLOWED_MIME_TYPES},
            )
        if len(content) > self._settings.MAX_UPLOAD_BYTES:
            raise ValidationError(
                "File exceeds the 20MB upload limit.",
                details={"max_bytes": self._settings.MAX_UPLOAD_BYTES},
            )
        if not filename:
            raise ValidationError("Uploaded file has no name.")
