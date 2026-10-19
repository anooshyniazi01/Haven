"""Error classes and exception handlers for Haven API."""

from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger

logger = get_logger("errors")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HavenError(Exception):
    """Base exception for Haven application errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class DatabaseError(HavenError):
    def __init__(
        self,
        message: str = "Database operation failed.",
        code: str = "DATABASE_ERROR",
        status_code: int = status.HTTP_503_SERVICE_UNAVAILABLE,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message=message, code=code, status_code=status_code, details=details)


class ResourceNotFoundError(HavenError):
    def __init__(
        self,
        message: str = "The requested resource was not found.",
        code: str = "RESOURCE_NOT_FOUND",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class InvalidFileError(HavenError):
    def __init__(
        self,
        message: str = "The uploaded file is invalid or malformed.",
        code: str = "INVALID_FILE",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class FileTooLargeError(HavenError):
    def __init__(
        self,
        message: str = "File exceeds the maximum permitted size limit.",
        code: str = "FILE_TOO_LARGE",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
            details=details,
        )


class UnsupportedMediaTypeError(HavenError):
    def __init__(
        self,
        message: str = "This image format is not supported.",
        code: str = "UNSUPPORTED_MEDIA_TYPE",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            details=details or {"supported_formats": ["JPEG", "PNG", "WEBP"]},
        )


class StorageError(HavenError):
    def __init__(
        self,
        message: str = "An error occurred while storing the file.",
        code: str = "STORAGE_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class AnalysisNotFoundError(HavenError):
    def __init__(
        self,
        message: str = "The requested analysis was not found.",
        code: str = "ANALYSIS_NOT_FOUND",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class EvidenceNotFoundError(HavenError):
    def __init__(
        self,
        message: str = "The requested evidence was not found.",
        code: str = "EVIDENCE_NOT_FOUND",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class IncidentNotFoundError(HavenError):
    def __init__(
        self,
        message: str = "The requested incident was not found.",
        code: str = "INCIDENT_NOT_FOUND",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class AnalysisStateError(HavenError):
    def __init__(
        self,
        message: str = "Analysis cannot be run in its current state.",
        code: str = "ANALYSIS_STATE_INVALID",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class AnalysisUnprocessableError(HavenError):
    def __init__(
        self,
        message: str = "The evidence file is unreadable or unsuitable for analysis.",
        code: str = "ANALYSIS_UNPROCESSABLE",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class AnalysisServiceUnavailableError(HavenError):
    def __init__(
        self,
        message: str = "Analysis engine is currently unavailable.",
        code: str = "ANALYSIS_SERVICE_UNAVAILABLE",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
        )



def register_exception_handlers(app: FastAPI) -> None:
    """Register uniform exception handlers on the FastAPI application."""

    @app.exception_handler(HavenError)
    async def haven_error_handler(_request: Request, exc: HavenError) -> JSONResponse:
        logger.warning("Application error [%s]: %s", exc.code, exc.message)
        payload = ErrorResponse(
            error=ErrorDetail(
                code=exc.code,
                message=exc.message,
                details=exc.details,
            )
        ).model_dump(exclude_none=True)
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.info("Validation error on request: %s", exc.errors())
        payload = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="The submitted request data is invalid.",
                details={"errors": [e.get("msg") for e in exc.errors()]},
            )
        ).model_dump(exclude_none=True)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        _request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code_map = {
            status.HTTP_404_NOT_FOUND: "RESOURCE_NOT_FOUND",
            status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
            status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
            status.HTTP_403_FORBIDDEN: "FORBIDDEN",
            status.HTTP_409_CONFLICT: "INVALID_STATE",
            getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413): "FILE_TOO_LARGE",
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
            status.HTTP_503_SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
        }
        code = code_map.get(exc.status_code, "HTTP_ERROR")
        payload = ErrorResponse(
            error=ErrorDetail(
                code=code,
                message=str(exc.detail) if exc.detail else "An HTTP error occurred.",
            )
        ).model_dump(exclude_none=True)
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(Exception)
    async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled server exception: %s", str(exc), exc_info=True)
        # Never leak internal stack trace or paths to user
        payload = ErrorResponse(
            error=ErrorDetail(
                code="INTERNAL_ERROR",
                message="An unexpected server error occurred. Please try again later.",
            )
        ).model_dump(exclude_none=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload
        )
