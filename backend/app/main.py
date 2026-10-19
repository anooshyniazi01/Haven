"""Haven Backend Application Entry Point."""

from contextlib import asynccontextmanager
import os
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.analysis import router as analysis_router
from app.api.routes.evidence import router as evidence_router
from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import get_logger, setup_logging


setup_logging(settings.LOG_LEVEL)
logger = get_logger("main")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle management."""
    logger.info("Initializing Haven Backend [%s mode]", settings.APP_ENV)

    # Ensure local storage root directory exists (handle read-only serverless filesystems)
    try:
        os.makedirs(settings.STORAGE_ROOT, exist_ok=True)
        logger.info("Validated private storage root at: %s", settings.STORAGE_ROOT)
    except OSError as e:
        logger.warning("Could not create storage root %s: %s. Using /tmp/storage", settings.STORAGE_ROOT, e)
        settings.STORAGE_ROOT = "/tmp/storage"
        os.makedirs(settings.STORAGE_ROOT, exist_ok=True)

    # Initialize SQLite database schema
    try:
        from app.db.base import Base
        from app.db.session import engine
        import app.db.models
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        logger.warning("Database schema check notice: %s", exc)

    yield

    logger.info("Shutting down Haven Backend")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    app = FastAPI(
        title="Haven API",
        description="AI-Assisted Blackmail Protection & Media Forensics API",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS configuration
    origins = [settings.FRONTEND_ORIGIN]
    if "localhost" in settings.FRONTEND_ORIGIN:
        origins.append(settings.FRONTEND_ORIGIN.replace("localhost", "127.0.0.1"))
    if settings.APP_ENV == "production":
        origins.append("*")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Exception handlers
    register_exception_handlers(app)

    # Register API routes
    app.include_router(health_router)
    app.include_router(evidence_router, prefix=settings.API_V1_PREFIX)
    app.include_router(analysis_router, prefix=settings.API_V1_PREFIX)
    app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)

    # Mount unified frontend distribution if available (production single public URL deployment)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(base_dir, "..", "..", "..", "frontend", "dist")),
        os.path.abspath(os.path.join(base_dir, "..", "..", "frontend_dist")),
        os.path.abspath(os.path.join(base_dir, "..", "..", "frontend", "dist")),
        "/app/frontend_dist",
        "/app/frontend/dist",
    ]
    frontend_dist = next(
        (c for c in candidates if os.path.exists(c) and os.path.exists(os.path.join(c, "index.html"))),
        None,
    )

    if frontend_dist:
        from fastapi.staticfiles import StaticFiles
        from fastapi.responses import FileResponse

        logger.info("Mounting unified frontend SPA from: %s", frontend_dist)
        assets_dir = os.path.join(frontend_dist, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            # Never intercept API, health, or interactive documentation routes
            if (
                full_path.startswith("api/")
                or full_path.startswith("health")
                or full_path.startswith("docs")
                or full_path.startswith("openapi.json")
                or full_path.startswith("redoc")
            ):
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="Not Found")

            file_path = os.path.join(frontend_dist, full_path)
            if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(os.path.join(frontend_dist, "index.html"))

    return app


app = create_app()
