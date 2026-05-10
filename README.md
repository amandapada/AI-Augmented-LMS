# AI-Augmented LMS — Backend

FastAPI + PostgreSQL backend for an AI-augmented Learning Management System
targeted at ABU 500L Computer Engineering. Lecturers upload scanned handouts;
a VLM extracts text; lecturers audit and approve; students get flashcards,
quizzes, and a RAG chat grounded in the handout. Lecturer analytics close the
loop.

## Project layout

```
app/
├── main.py               # FastAPI app factory
├── core/                 # config, security, deps, exceptions, rate limiting
├── db/                   # engine, session factory, migrations
├── models/               # SQLAlchemy ORM, one file per aggregate
├── schemas/              # Pydantic DTOs for API I/O
├── repositories/         # BaseRepository[T] + per-aggregate queries
├── services/
│   ├── ai/               # GroqClient, VLMService, LLMService, RAGService
│   ├── auth_service.py
│   ├── handout_service.py
│   ├── flashcard_service.py
│   ├── quiz_service.py
│   ├── chat_service.py
│   ├── analytics_service.py
│   ├── storage_service.py
│   └── queue_service.py
├── api/v1/               # versioned routers, aggregated in router.py
└── workers/              # BaseWorker + HandoutProcessor (queue consumer)
scripts/                  # create_db.py, smoke_test.py
tests/                    # unit + integration
```

Layering rule: each layer imports only from layers strictly below it
(api → services → repositories → models → core/db).

## Getting started

```bash
# 1. Create and activate a virtualenv, then:
pip install -r requirements.txt

# 2. Copy .env.example to .env and fill in your credentials:
cp .env.example .env

# 3. Verify external services are reachable:
python -m scripts.smoke_test

# 4. Create tables on first run (Alembic comes later):
python -m scripts.create_db

# 5. Start the API:
uvicorn app.main:app --reload

# 6. In a separate shell, start the background processor:
python -m app.workers
```

Open http://localhost:8000/docs for the auto-generated OpenAPI UI.

## Running tests

```bash
pytest
```

## Key design choices

- **Dependency injection via FastAPI `Depends`** — every service is
  constructed in `app/core/dependencies.py` and wired through the router.
  Tests override any node with `app.dependency_overrides`.
- **Repositories own every `db.query(...)`** — services are DB-agnostic and
  easy to unit test with fake repositories.
- **Provider-agnostic AI layer** — `AbstractAIClient` + `GroqClient`
  implementation means swapping to OpenAI / Anthropic touches one file.
- **Redis-backed worker queue** — long-running VLM extraction never blocks a
  FastAPI request thread; horizontal scaling = more `python -m app.workers`
  processes (SCAL-1).
- **Analytics caching** — 1-hour Redis TTL + durable snapshot in
  `analytics_snapshots` table (SCAL-2).

## Status against the PRD

Implemented: AUTH-1/2/3, UP-1..6, AUD-1..5, FC-1..5, QZ-1..6, CH-1..6,
AN-1..4, SEC-1/2/3/4/5/7, SCAL-1/2/3, REL-4.

Deferred (P1/P2): AUTH-4 (password reset), FC-6 summary endpoint, AN-5..7,
streaming chat (CH-7), Alembic migrations (scaffolded), Sentry hook.
