"""Bootstrap: create every table declared on the ORM ``Base``.

Intended for local development and first-time setup. Production environments
should use Alembic migrations once they exist in ``app/db/migrations``.

Run with::

    python -m scripts.create_db
"""

from __future__ import annotations

from app.db.session import SessionFactory


def main() -> None:
    SessionFactory.create_all()
    print("Database tables created.")


if __name__ == "__main__":
    main()
