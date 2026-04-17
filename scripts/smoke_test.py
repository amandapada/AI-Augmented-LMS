"""Connectivity smoke test.

Verifies that every external service the app depends on is reachable using
the values in ``.env``. Run it after a deploy or when onboarding a new dev::

    python -m scripts.smoke_test
"""

from __future__ import annotations

from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine


def check_database() -> None:
    print("1. PostgreSQL ...", end=" ")
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("OK")


def check_redis() -> None:
    import redis

    print("2. Redis ........", end=" ")
    client = redis.from_url(settings.UPSTASH_REDIS_URL)
    client.ping()
    print("OK")


def check_supabase() -> None:
    from supabase import create_client

    print("3. Supabase .....", end=" ")
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    buckets = client.storage.list_buckets()
    names = [b.name for b in buckets]
    if settings.SUPABASE_BUCKET not in names:
        client.storage.create_bucket(settings.SUPABASE_BUCKET, {"public": True})
    print(f"OK (buckets={names})")


def check_groq() -> None:
    from groq import Groq

    print("4. Groq .........", end=" ")
    client = Groq(api_key=settings.GROQ_API_KEY)
    resp = client.chat.completions.create(
        model=settings.GROQ_LLM_MODEL,
        messages=[{"role": "user", "content": "Say 'ok' only."}],
        max_tokens=5,
    )
    print(f"OK ({resp.choices[0].message.content!r})")


def main() -> None:
    for check in (check_database, check_redis, check_supabase, check_groq):
        try:
            check()
        except Exception as exc:
            print(f"FAILED — {exc}")
    print("\nSmoke test complete.")


if __name__ == "__main__":
    main()
