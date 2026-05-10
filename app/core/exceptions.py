"""Domain-level exceptions and the global FastAPI exception handler.

Every error that escapes the service layer should be one of these classes.
Raising a plain ``Exception`` is fine too (the global handler will catch it),
but using a typed error lets us map it to a sensible HTTP status without
leaking stack traces to clients.
"""

from __future__ import annotations

import logging
import traceback
from typing import Any, Dict

from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base class for all domain errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "app_error"

    def __init__(self, message: str, *, details: Dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class ValidationError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "validation_error"


class AuthenticationError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "authentication_error"


class AuthorizationError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "authorization_error"


class RateLimitError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "rate_limited"


class ExternalServiceError(AppError):
    """Raised when an upstream (Groq, Supabase, Redis) fails in a way we can't recover from."""

    status_code = status.HTTP_502_BAD_GATEWAY
    code = "external_service_error"


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Serialize a known :class:`AppError` as a structured JSON response."""

    logger.warning("AppError on %s: %s", request.url.path, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message, "details": exc.details},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for anything that wasn't converted to an :class:`AppError`.

    In development we return the traceback to make debugging fast; in
    production we only return a generic message so internals aren't leaked.
    """

    from app.core.config import settings  # local import avoids circular on boot

    logger.exception("Unhandled exception on %s", request.url.path)
    body: Dict[str, Any] = {"code": "internal_error", "message": "An unexpected error occurred."}
    if settings.DEBUG:
        body["traceback"] = traceback.format_exc()
        body["path"] = str(request.url)
    return JSONResponse(status_code=500, content=body)
