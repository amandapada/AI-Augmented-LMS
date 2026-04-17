"""Redis-backed job queue.

A :class:`QueueService` instance models exactly one queue (default name
``handout_queue``). Producers call :meth:`enqueue`; the worker loop calls
:meth:`blocking_dequeue`. Swapping to RabbitMQ or SQS would mean replacing
this class only.
"""

from __future__ import annotations

import logging
from typing import Protocol

logger = logging.getLogger(__name__)


class _RedisLike(Protocol):
    def lpush(self, key: str, value: bytes | str) -> int: ...  # pragma: no cover
    def brpop(self, keys, timeout: int = 0): ...  # pragma: no cover


class QueueService:
    """Simple FIFO queue with blocking dequeue for worker loops."""

    DEFAULT_QUEUE = "handout_queue"

    def __init__(self, redis_client: _RedisLike, queue_name: str = DEFAULT_QUEUE) -> None:
        self._redis = redis_client
        self._queue = queue_name

    def enqueue(self, job_id: int | str) -> None:
        """Push a job onto the head of the queue."""
        logger.info("Enqueued job %s on %s", job_id, self._queue)
        self._redis.lpush(self._queue, str(job_id))

    def blocking_dequeue(self, timeout_seconds: int = 30) -> str | None:
        """Block until a job is available or ``timeout_seconds`` elapses.

        Returns the raw job payload (job id) as a string, or ``None`` on
        timeout so the worker can heartbeat.
        """
        job = self._redis.brpop(self._queue, timeout=timeout_seconds)
        if not job:
            return None
        _, payload = job
        return payload.decode() if isinstance(payload, (bytes, bytearray)) else str(payload)
