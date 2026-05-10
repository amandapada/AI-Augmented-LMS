"""Application configuration.

All environment variables are read exactly once, at process start, through the
:class:`Settings` class. Anywhere else in the codebase, code should import
``settings`` from this module rather than calling ``os.getenv`` directly — this
gives us type-checking, defaults, and validation in a single place.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed view of the ``.env`` file.

    Pydantic validates types and raises at startup if a required var is missing,
    which is a deliberate fail-fast: we'd rather the process crash on boot than
    hit a ``NoneType`` error deep inside a request handler.
    """

    # ---- Core app ----
    APP_NAME: str = "AI-Augmented LMS API"
    ENV: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ---- Security / auth ----
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day; refresh tokens are post-MVP
    BCRYPT_ROUNDS: int = 12  # SEC-1 requires cost >= 12

    # ---- Infrastructure ----
    DATABASE_URL: str
    UPSTASH_REDIS_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_BUCKET: str = "handouts"

    # ---- AI providers ----
    GROQ_API_KEY: str
    GROQ_VLM_MODEL: str = "llama-3.2-90b-vision-preview"
    GROQ_LLM_MODEL: str = "llama-3.3-70b-versatile"

    # ---- Uploads / limits ----
    MAX_UPLOAD_BYTES: int = 20 * 1024 * 1024  # 20MB hard cap (UP-1, SEC-3)
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
    ]

    # ---- Rate limiting ----
    CHAT_RATE_LIMIT_PER_MINUTE: int = 10  # CH-6
    DEFAULT_RATE_LIMIT_PER_MINUTE: int = 60  # SEC-4 baseline for other endpoints

    # ---- Analytics cache ----
    ANALYTICS_CACHE_SECONDS: int = 3600  # SCAL-2 — refresh every hour

    # ---- CORS ----
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached :class:`Settings` instance.

    FastAPI ``Depends(get_settings)`` will reuse the same object across
    requests. Call this function (not the class directly) so tests can override
    it with ``app.dependency_overrides``.
    """

    return Settings()  # type: ignore[call-arg]


# Module-level convenience handle. Use this inside non-request code
# (workers, scripts) where DI isn't available.
settings = get_settings()
