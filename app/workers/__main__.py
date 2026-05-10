"""Entry point so you can run ``python -m app.workers`` to start the processor."""

from __future__ import annotations

from app.workers.handout_worker import build_default_worker


def main() -> None:
    worker = build_default_worker()
    worker.run()


if __name__ == "__main__":
    main()
