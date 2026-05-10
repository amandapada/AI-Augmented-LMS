"""Declarative base shared by all ORM models.

Keeping this in its own module (rather than next to the engine) avoids a
circular import: models import ``Base`` here, while ``session.py`` imports
models via ``app.models`` for ``create_all``.
"""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Root declarative class. Every ORM model inherits from this."""
