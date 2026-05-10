"""Queries against the ``users`` table."""

from __future__ import annotations

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def get_by_email(self, email: str) -> User | None:
        """Case-sensitive email lookup — emails are stored lowercased by AuthService."""
        return self.db.query(User).filter(User.email == email).one_or_none()
