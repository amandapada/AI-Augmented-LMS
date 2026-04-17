"""User aggregate: account, role, and credentials."""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum as SQLEnum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserRole(str, enum.Enum):
    """Role-based access (AUTH-3).

    ``ADMIN`` is reserved for analytics dashboards; the MVP only distinguishes
    STUDENT vs LECTURER at the authorization layer.
    """

    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN = "admin"


class User(Base):
    """Registered user of the LMS (AUTH-1)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role"), nullable=False, default=UserRole.STUDENT
    )
    # Optional display name — useful in analytics per-student views (AN-5).
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
