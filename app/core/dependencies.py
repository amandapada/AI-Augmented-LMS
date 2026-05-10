"""FastAPI dependency providers.

All shared, long-lived collaborators (DB session, Redis client, AI clients,
services) are constructed here and injected via ``Depends(...)``. Keeping
construction in one module lets tests override any piece via
``app.dependency_overrides``.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Generator

import redis
from fastapi import Depends, Header, status
from sqlalchemy.orm import Session
from supabase import Client, create_client

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.rate_limit import RateLimiter
from app.core.security import JWTService, PasswordHasher, build_jwt_service, build_password_hasher
from app.db.session import SessionFactory
from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository
from app.services.ai.groq_client import GroqClient
from app.services.ai.llm_service import LLMService
from app.services.ai.rag_service import RAGService
from app.services.ai.vlm_service import VLMService
from app.services.analytics_service import AnalyticsService
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.flashcard_service import FlashcardService
from app.services.handout_service import HandoutService
from app.services.quiz_service import QuizService
from app.services.queue_service import QueueService
from app.services.storage_service import StorageService

# --------------------------------------------------------------------------- #
# DB session
# --------------------------------------------------------------------------- #


def get_db() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy session tied to the request lifecycle.

    The session is always closed after the request, even if the handler raises.
    """

    with SessionFactory.session_scope() as session:
        yield session


# --------------------------------------------------------------------------- #
# External clients (singletons for the process)
# --------------------------------------------------------------------------- #


@lru_cache(maxsize=1)
def get_redis_client(settings: Settings = Depends(get_settings)) -> redis.Redis:
    """Return a process-wide Redis client."""
    return redis.from_url(settings.UPSTASH_REDIS_URL, decode_responses=False)


@lru_cache(maxsize=1)
def get_supabase_client(settings: Settings = Depends(get_settings)) -> Client:
    """Return a process-wide Supabase client."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


@lru_cache(maxsize=1)
def get_groq_client(settings: Settings = Depends(get_settings)) -> GroqClient:
    """Return a process-wide Groq client wrapper."""
    return GroqClient(
        api_key=settings.GROQ_API_KEY,
        llm_model=settings.GROQ_LLM_MODEL,
        vlm_model=settings.GROQ_VLM_MODEL,
    )


# --------------------------------------------------------------------------- #
# Security collaborators
# --------------------------------------------------------------------------- #


@lru_cache(maxsize=1)
def get_password_hasher(settings: Settings = Depends(get_settings)) -> PasswordHasher:
    return build_password_hasher(settings)


@lru_cache(maxsize=1)
def get_jwt_service(settings: Settings = Depends(get_settings)) -> JWTService:
    return build_jwt_service(settings)


def get_rate_limiter(
    redis_client: redis.Redis = Depends(get_redis_client),
) -> RateLimiter:
    return RateLimiter(redis_client)


# --------------------------------------------------------------------------- #
# Infra services
# --------------------------------------------------------------------------- #


def get_storage_service(
    supabase: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> StorageService:
    return StorageService(supabase_client=supabase, bucket=settings.SUPABASE_BUCKET)


def get_queue_service(redis_client: redis.Redis = Depends(get_redis_client)) -> QueueService:
    return QueueService(redis_client=redis_client)


# --------------------------------------------------------------------------- #
# AI services
# --------------------------------------------------------------------------- #


def get_vlm_service(groq: GroqClient = Depends(get_groq_client)) -> VLMService:
    return VLMService(groq=groq)


def get_llm_service(groq: GroqClient = Depends(get_groq_client)) -> LLMService:
    return LLMService(groq=groq)


def get_rag_service(
    llm: LLMService = Depends(get_llm_service),
) -> RAGService:
    return RAGService(llm=llm)


# --------------------------------------------------------------------------- #
# Domain services
# --------------------------------------------------------------------------- #


def get_auth_service(
    db: Session = Depends(get_db),
    hasher: PasswordHasher = Depends(get_password_hasher),
    jwt_service: JWTService = Depends(get_jwt_service),
) -> AuthService:
    return AuthService(db=db, hasher=hasher, jwt_service=jwt_service)


def get_handout_service(
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
    queue: QueueService = Depends(get_queue_service),
    settings: Settings = Depends(get_settings),
) -> HandoutService:
    return HandoutService(db=db, storage=storage, queue=queue, settings=settings)


def get_flashcard_service(
    db: Session = Depends(get_db),
    llm: LLMService = Depends(get_llm_service),
) -> FlashcardService:
    return FlashcardService(db=db, llm=llm)


def get_quiz_service(
    db: Session = Depends(get_db),
    llm: LLMService = Depends(get_llm_service),
) -> QuizService:
    return QuizService(db=db, llm=llm)


def get_chat_service(
    db: Session = Depends(get_db),
    rag: RAGService = Depends(get_rag_service),
    limiter: RateLimiter = Depends(get_rate_limiter),
    settings: Settings = Depends(get_settings),
) -> ChatService:
    return ChatService(db=db, rag=rag, limiter=limiter, settings=settings)


def get_analytics_service(
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client),
    settings: Settings = Depends(get_settings),
) -> AnalyticsService:
    return AnalyticsService(db=db, redis_client=redis_client, settings=settings)


# --------------------------------------------------------------------------- #
# Auth dependencies
# --------------------------------------------------------------------------- #


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    jwt_service: JWTService = Depends(get_jwt_service),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the ``Authorization: Bearer ...`` header."""

    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Missing or malformed Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    payload = jwt_service.decode(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Token missing subject claim")

    user = UserRepository(db).get(int(user_id))
    if user is None:
        raise AuthenticationError("User no longer exists")
    return user


def require_role(*allowed: UserRole):
    """Dependency factory that asserts the caller has one of ``allowed`` roles (AUTH-3)."""

    def _guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise AuthorizationError(
                "You do not have permission to perform this action",
                details={"required_roles": [r.value for r in allowed]},
            )
        return user

    return _guard
