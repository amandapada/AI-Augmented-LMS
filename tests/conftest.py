"""Shared pytest fixtures.

Currently minimal — extend as unit/integration tests land. Uses an in-memory
SQLite engine to avoid requiring Postgres for unit tests.
"""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
import app.models  # noqa: F401  — registers all models on Base


@pytest.fixture()
def db_session():
    """Fresh in-memory SQLite session per test."""
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()
