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

    # Ensure local storage root directory exists
    os.makedirs(settings.STORAGE_ROOT, exist_ok=True)
    logger.info("Validated private storage root at: %s", settings.STORAGE_ROOT)

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
    # Allow 127.0.0.1 variant if localhost is configured
    if "localhost" in settings.FRONTEND_ORIGIN:
        origins.append(settings.FRONTEND_ORIGIN.replace("localhost", "127.0.0.1"))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Exception handlers
    register_exception_handlers(app)

    # Register routes
    app.include_router(health_router)
    app.include_router(evidence_router, prefix=settings.API_V1_PREFIX)
    app.include_router(analysis_router, prefix=settings.API_V1_PREFIX)
    app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)

    return app



app = create_app()
