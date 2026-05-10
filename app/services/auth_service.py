"""Registration and login (AUTH-1, AUTH-2, SEC-1)."""

from __future__ import annotations

import secrets
import time
from typing import Dict, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, ValidationError
from app.core.security import JWTService, PasswordHasher
from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic

# Dev/single-instance token store — replace with Redis + email delivery in production.
_RESET_TOKENS: Dict[str, Tuple[str, float]] = {}


class AuthService:
    """Owns every flow that reads or writes credentials."""

    def __init__(
        self,
        db: Session,
        hasher: PasswordHasher,
        jwt_service: JWTService,
    ) -> None:
        self._db = db
        self._users = UserRepository(db)
        self._hasher = hasher
        self._jwt = jwt_service

    # ---- Registration ----

    def register(self, payload: RegisterRequest) -> tuple[UserPublic, TokenResponse]:
        """Create a new user and immediately issue an access token.

        Emails are lower-cased before storage to make lookups case-insensitive
        without needing a functional index.
        """
        email = payload.email.lower().strip()
        if self._users.get_by_email(email) is not None:
            raise ValidationError("An account with that email already exists.")

        user = User(
            email=email,
            hashed_password=self._hasher.hash(payload.password),
            role=payload.role or UserRole.STUDENT,
            full_name=payload.full_name,
        )
        self._users.add(user)
        return UserPublic.model_validate(user), self._issue_token(user)

    # ---- Login ----

    def login(self, payload: LoginRequest) -> tuple[UserPublic, TokenResponse]:
        """Validate credentials and return a token.

        We deliberately use the same error message for "no user" and "bad
        password" so callers can't enumerate accounts (SEC best practice).
        """
        email = payload.email.lower().strip()
        user = self._users.get_by_email(email)
        if user is None or not self._hasher.verify(payload.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")
        return UserPublic.model_validate(user), self._issue_token(user)

    # ---- Password reset (stub mailer; token logged in dev) ----

    FORGOT_PASSWORD_ACK = (
        "If an account exists for that email, we sent instructions to reset your password."
    )

    def request_password_reset(self, email: str) -> str:
        """Issue a reset token only when the user exists; always return the same public message."""
        normalized = email.lower().strip()
        user = self._users.get_by_email(normalized)
        if user is None:
            return self.FORGOT_PASSWORD_ACK

        token = secrets.token_urlsafe(32)
        _RESET_TOKENS[token] = (normalized, time.time() + 3600)
        # Production: enqueue email with FRONTEND_URL/reset-password?token=...
        print(
            f"[password-reset] Dev link for {normalized}: /reset-password?token={token}",
            flush=True,
        )
        return self.FORGOT_PASSWORD_ACK

    def reset_password(self, token: str, password: str) -> None:
        """Validate token and persist a new password hash."""
        entry = _RESET_TOKENS.pop(token, None)
        if entry is None or entry[1] < time.time():
            raise ValidationError("This reset link is invalid or has expired. Request a new one.")

        email = entry[0]
        user = self._users.get_by_email(email)
        if user is None:
            raise ValidationError("This reset link is invalid or has expired. Request a new one.")

        user.hashed_password = self._hasher.hash(password)
        self._users.update(user)

    # ---- helpers ----

    def _issue_token(self, user: User) -> TokenResponse:
        token = self._jwt.create_access_token(
            subject=user.id, extra_claims={"role": user.role.value}
        )
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in_minutes=self._jwt._expire_minutes,  # safe: same package
        )
