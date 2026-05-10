"""Reusable worker loop.

Subclasses implement :meth:`handle` — the base class handles polling,
heartbeat output, signal-based shutdown, and error isolation. Adding a new
background job type is then a one-method subclass.
"""

from __future__ import annotations

import logging
import signal
import time
from abc import ABC, abstractmethod

from app.services.queue_service import QueueService

logger = logging.getLogger(__name__)


class BaseWorker(ABC):
    """Long-lived consumer of a single queue."""

    #: Poll interval used when the queue is idle.
    IDLE_HEARTBEAT_SECONDS = 30
    #: Backoff applied after an unexpected error in the loop.
    ERROR_BACKOFF_SECONDS = 5

    def __init__(self, queue: QueueService) -> None:
        self._queue = queue
        self._running = True

    # ---- Template method ----

    def run(self) -> None:
        """Main polling loop. Blocks until SIGINT/SIGTERM or :meth:`stop`."""
        self._install_signal_handlers()
        logger.info("%s started; polling queue", self.__class__.__name__)
        while self._running:
            try:
                payload = self._queue.blocking_dequeue(
                    timeout_seconds=self.IDLE_HEARTBEAT_SECONDS
                )
                if payload is None:
                    continue  # heartbeat tick — no job available
                logger.info("Received job: %s", payload)
                self.handle(payload)
            except KeyboardInterrupt:
                self.stop()
            except Exception:
                logger.exception("Worker loop error — backing off %ds", self.ERROR_BACKOFF_SECONDS)
                time.sleep(self.ERROR_BACKOFF_SECONDS)
        logger.info("%s stopped", self.__class__.__name__)

    def stop(self) -> None:
        """Signal the loop to exit after the current iteration."""
        self._running = False

    # ---- Subclass contract ----

    @abstractmethod
    def handle(self, payload: str) -> None:
        """Process a single job payload (the raw queue message)."""

    # ---- Internals ----

    def _install_signal_handlers(self) -> None:
        """Wire SIGINT/SIGTERM → graceful stop. No-op on platforms without signals."""
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                signal.signal(sig, lambda *_: self.stop())
            except (ValueError, AttributeError):
                # Running on a non-main thread or on Windows w/o SIGTERM — safe to ignore.
                pass
