"""Password hashing and JWT token utilities.

Both responsibilities are wrapped in small classes so they can be swapped or
mocked in tests. They hold no per-request state, so one instance per process
is fine — :mod:`app.core.dependencies` wires them as singletons.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
from passlib.context import CryptContext

from app.core.config import Settings
from app.core.exceptions import AuthenticationError


class PasswordHasher:
    """Thin wrapper over Passlib's bcrypt implementation.

    Exists so the API layer never imports passlib directly. Also pins the
    bcrypt cost factor to :attr:`Settings.BCRYPT_ROUNDS` (SEC-1).
    """

    def __init__(self, rounds: int = 12) -> None:
        self._ctx = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=rounds)

    def hash(self, password: str) -> str:
        """Return the bcrypt hash of ``password``."""
        return self._ctx.hash(password)

    def verify(self, password: str, hashed: str) -> bool:
        """Return True if ``password`` matches ``hashed``."""
        return self._ctx.verify(password, hashed)


class JWTService:
    """Issues and decodes HS256 JWTs used for session authentication (AUTH-2)."""

    def __init__(self, secret: str, algorithm: str = "HS256", expire_minutes: int = 60) -> None:
        self._secret = secret
        self._algorithm = algorithm
        self._expire_minutes = expire_minutes

    def create_access_token(self, subject: str | int, extra_claims: Dict[str, Any] | None = None) -> str:
        """Create a signed JWT whose ``sub`` claim identifies the user."""

        now = datetime.now(timezone.utc)
        payload: Dict[str, Any] = {
            "sub": str(subject),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=self._expire_minutes)).timestamp()),
        }
        if extra_claims:
            payload.update(extra_claims)
        return jwt.encode(payload, self._secret, algorithm=self._algorithm)

    def decode(self, token: str) -> Dict[str, Any]:
        """Verify and decode a JWT, raising :class:`AuthenticationError` on failure."""

        try:
            return jwt.decode(token, self._secret, algorithms=[self._algorithm])
        except jwt.ExpiredSignatureError as exc:
            raise AuthenticationError("Token has expired") from exc
        except jwt.InvalidTokenError as exc:
            raise AuthenticationError("Invalid authentication token") from exc


def build_password_hasher(settings: Settings) -> PasswordHasher:
    """Factory so DI wires the hasher with the configured cost."""
    return PasswordHasher(rounds=settings.BCRYPT_ROUNDS)


def build_jwt_service(settings: Settings) -> JWTService:
    """Factory so DI wires the JWT service with the configured secret/ttl."""
    return JWTService(
        secret=settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
        expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )
