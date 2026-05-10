"""SQLAlchemy engine, session factory, and schema bootstrap helper.

Exposes a single :class:`SessionFactory` so the rest of the app doesn't touch
SQLAlchemy module globals. This makes it painless to point tests at a
separate SQLite / test database.
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base


class SessionFactory:
    """Owns the engine and the sessionmaker.

    Uses class-level attributes (no instance) because there is exactly one
    engine per process. SCAL-3: ``pool_pre_ping`` avoids stale connections
    after idle periods on serverless Postgres; ``pool_recycle`` caps
    connection age.
    """

    engine: Engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )
    _sessionmaker = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    @classmethod
    @contextmanager
    def session_scope(cls) -> Iterator[Session]:
        """Yield a transactional session that is always closed on exit.

        We deliberately do *not* auto-commit here. Services decide when a
        transaction is complete; this context only guarantees cleanup.
        """

        session = cls._sessionmaker()
        try:
            yield session
        finally:
            session.close()

    @classmethod
    def create_all(cls) -> None:
        """Create every table declared on :class:`Base`.

        Used by ``scripts/create_db.py`` for local bootstrap. Production
        uses Alembic migrations instead.
        """

        # Import the models package so every model class is registered on
        # ``Base.metadata`` before we ask the engine to create tables.
        import app.models  # noqa: F401

        Base.metadata.create_all(bind=cls.engine)


# Convenience module-level aliases for workers/scripts that don't use DI.
engine = SessionFactory.engine
SessionLocal = SessionFactory._sessionmaker
