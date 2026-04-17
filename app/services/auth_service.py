"""Registration and login (AUTH-1, AUTH-2, SEC-1)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, ValidationError
from app.core.security import JWTService, PasswordHasher
from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic


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
