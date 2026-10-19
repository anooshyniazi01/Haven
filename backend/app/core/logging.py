"""Logging configuration for Haven.

Ensures structured, non-sensitive logging according to docs/SECURITY.md and docs/PRIVACY.md.
Never logs raw image bytes, sensitive incident descriptions, secrets, or internal server paths.
"""

import logging
import sys
from typing import Optional


def setup_logging(level: str = "INFO") -> None:
    """Configure root logger with safe formatting."""
    log_level = getattr(logging, level.upper(), logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
        force=True,
    )


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Return a logger instance for the given component."""
    return logging.getLogger(name or "haven")
