"""Redis-backed fixed-window rate limiter.

We pick fixed-window over token-bucket because it's O(1) in Redis ops and the
product requirement (CH-6: "10 messages per minute per student") is expressed
in whole-minute buckets anyway.
"""

from __future__ import annotations

from typing import Protocol

from app.core.exceptions import RateLimitError


class _RedisLike(Protocol):
    """Subset of the redis-py client surface we depend on."""

    def incr(self, key: str) -> int: ...  # pragma: no cover
    def expire(self, key: str, seconds: int) -> bool: ...  # pragma: no cover


class RateLimiter:
    """Enforces ``limit`` hits per ``window_seconds`` for a given key.

    Usage::

        limiter = RateLimiter(redis_client)
        limiter.check(f"chat:{user_id}", limit=10, window_seconds=60)
    """

    def __init__(self, redis: _RedisLike) -> None:
        self._redis = redis

    def check(self, key: str, *, limit: int, window_seconds: int = 60) -> None:
        """Record one hit; raise :class:`RateLimitError` if ``limit`` is exceeded.

        Uses INCR + EXPIRE. The EXPIRE is set only on the first hit of a window
        (``current == 1``) so the TTL isn't refreshed on every call.
        """

        namespaced = f"ratelimit:{key}"
        current = self._redis.incr(namespaced)
        if current == 1:
            self._redis.expire(namespaced, window_seconds)
        if current > limit:
            raise RateLimitError(
                f"Rate limit exceeded: {limit} requests per {window_seconds}s",
                details={"limit": limit, "window_seconds": window_seconds},
            )
