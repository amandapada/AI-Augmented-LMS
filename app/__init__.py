"""AI-Augmented LMS backend package.

The project is structured in layered fashion:

- ``app.core``        : cross-cutting utilities (config, security, deps, errors, rate limiting)
- ``app.db``          : SQLAlchemy engine/session and Alembic migrations
- ``app.models``      : ORM entities grouped per aggregate
- ``app.schemas``     : Pydantic request/response DTOs
- ``app.repositories``: data access objects
- ``app.services``    : business logic and external integrations
- ``app.api``         : HTTP routers (versioned under ``v1``)
- ``app.workers``     : background queue consumers

Each layer may only import from layers strictly below it. This keeps the
dependency graph acyclic and makes the codebase predictable for new contributors.
"""
