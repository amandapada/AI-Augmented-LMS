"""FastAPI application factory.

The ``create_app`` pattern keeps module-import side effects predictable:
nothing starts until you call the factory. Tests instantiate their own
app with overridden settings.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.exceptions import AppError, app_error_handler, unhandled_exception_handler


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build and return a configured :class:`FastAPI` instance."""

    settings = settings or get_settings()
    logging.basicConfig(
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS — open during development; tighten to the deployed web origin in prod.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers: domain errors → structured 4xx, anything else → 500 envelope.
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # Versioned API.
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/health", tags=["meta"])
    def health_check():
        """Lightweight liveness probe used by Fly/Render/uptime monitors."""
        return {"status": "healthy", "app": settings.APP_NAME, "env": settings.ENV}

    return app


# Default app instance for ``uvicorn app.main:app`` in local dev + production.
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
