"""Supabase Storage adapter.

Isolating all Supabase calls here means a future migration (to S3, Cloudflare
R2, local FS for tests) touches exactly this file.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol

from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class _SupabaseClient(Protocol):
    """Subset of supabase-py we use — keeps type-checkers honest."""

    def storage(self): ...  # pragma: no cover


@dataclass
class UploadedFile:
    """Return type of :meth:`StorageService.upload`."""

    key: str  # storage key inside the bucket (e.g. ``uploads/<uuid>.pdf``)
    public_url: str


class StorageService:
    """Thin wrapper around Supabase Storage for the ``handouts`` bucket."""

    #: All uploads live under this prefix so they're easy to identify in the bucket UI.
    UPLOAD_PREFIX = "uploads"

    def __init__(self, supabase_client, bucket: str) -> None:
        self._supabase = supabase_client
        self._bucket = bucket

    # ---- Uploads ----

    def upload(self, *, key: str, content: bytes, content_type: str) -> UploadedFile:
        """Upload ``content`` under ``<UPLOAD_PREFIX>/<key>`` and return its URL."""
        path = f"{self.UPLOAD_PREFIX}/{key}"
        try:
            self._supabase.storage.from_(self._bucket).upload(
                path, content, {"content-type": content_type}
            )
            public_url = self._supabase.storage.from_(self._bucket).get_public_url(path)
        except Exception as exc:
            logger.exception("Supabase upload failed")
            raise ExternalServiceError(f"Upload to storage failed: {exc}") from exc
        return UploadedFile(key=path, public_url=public_url)

    # ---- Downloads ----

    def download(self, key: str) -> bytes:
        """Fetch raw bytes for a storage key (full path including prefix)."""
        try:
            return self._supabase.storage.from_(self._bucket).download(key)
        except Exception as exc:
            logger.exception("Supabase download failed for %s", key)
            raise ExternalServiceError(f"Download from storage failed: {exc}") from exc

    def extract_key_from_url(self, file_url: str) -> str:
        """Recover the storage key from a public URL.

        Supabase public URLs end with ``/<bucket>/<path>``. We split on the
        bucket name and return the path. Lives here so callers don't hard-code
        URL parsing.
        """
        marker = f"/{self._bucket}/"
        if marker in file_url:
            return file_url.split(marker, 1)[1]
        # Fallback: treat the trailing path as the key.
        return file_url.rsplit("/", 1)[-1]
