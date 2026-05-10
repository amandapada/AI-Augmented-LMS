"""Data-access layer.

Repositories own all direct ORM queries. Services depend on repositories, never
on SQLAlchemy directly — this gives us a single place to tune queries and
makes services trivial to unit test with in-memory fakes.
"""
