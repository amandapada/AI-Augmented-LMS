"""Generic CRUD repository.

Every aggregate gets its own repository class (e.g. ``HandoutRepository``)
that subclasses :class:`BaseRepository` and adds domain-specific queries.
Repositories own *all* ``db.query(...)`` calls — services must never talk to
SQLAlchemy directly. This rule keeps query tuning localised and gives tests a
single seam for swapping in fakes.
"""

from __future__ import annotations

from typing import Generic, List, Type, TypeVar

from sqlalchemy.orm import Session

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Basic CRUD on a single table keyed by integer id."""

    #: Subclasses must set this to the ORM class they manage.
    model: Type[ModelT]

    def __init__(self, db: Session) -> None:
        self.db = db

    # ---- Reads ----

    def get(self, id_: int) -> ModelT | None:
        """Return the row with the given primary key, or ``None``."""
        return self.db.get(self.model, id_)

    def list(self, *, limit: int = 100, offset: int = 0) -> List[ModelT]:
        """Return a slice of rows ordered by insertion (id)."""
        return (
            self.db.query(self.model).order_by(self.model.id.desc()).offset(offset).limit(limit).all()
        )

    # ---- Writes ----

    def add(self, instance: ModelT, *, commit: bool = True) -> ModelT:
        """Persist a new entity and (by default) commit the transaction."""
        self.db.add(instance)
        if commit:
            self.db.commit()
            self.db.refresh(instance)
        else:
            self.db.flush()
        return instance

    def update(self, instance: ModelT, *, commit: bool = True) -> ModelT:
        """Flush pending changes on an already-tracked entity."""
        if commit:
            self.db.commit()
            self.db.refresh(instance)
        else:
            self.db.flush()
        return instance

    def delete(self, instance: ModelT, *, commit: bool = True) -> None:
        """Remove a row. Cascades defined on the ORM relationship apply."""
        self.db.delete(instance)
        if commit:
            self.db.commit()
