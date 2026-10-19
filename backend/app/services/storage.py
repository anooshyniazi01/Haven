"""Secure file storage, streaming validation, and cryptographic hashing service.
Conforms to docs/SECURITY.md, docs/EVIDENCE_HANDLING.md, and docs/TECH_STACK.md.
"""

from dataclasses import dataclass
import hashlib
import os
import re
from typing import Optional, Tuple
import uuid
from PIL import Image, UnidentifiedImageError
from PIL.Image import DecompressionBombError

from app.core.config import settings
from app.core.errors import (
    FileTooLargeError,
    InvalidFileError,
    StorageError,
    UnsupportedMediaTypeError,
)
from app.core.logging import get_logger

logger = get_logger("services.storage")

# Security bounds
MAX_IMAGE_WIDTH = 10000
MAX_IMAGE_HEIGHT = 10000
MAX_PIXELS = 25_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

STREAM_CHUNK_SIZE = 64 * 1024  # 64 KB bounded streaming chunks

ALLOWED_FORMATS = {
    "JPEG": {
        "mime": "image/jpeg",
        "ext": ".jpg",
    },
    "PNG": {
        "mime": "image/png",
        "ext": ".png",
    },
    "WEBP": {
        "mime": "image/webp",
        "ext": ".webp",
    },
}


@dataclass
class StoredEvidenceMetadata:
    storage_key: str
    original_filename: str
    file_size_bytes: int
    mime_type_detected: str
    sha256: str
    width: int
    height: int


def sanitize_filename(filename: Optional[str]) -> str:
    """Sanitize client-supplied filename for safe display metadata only.
    Never use this filename as a filesystem path.
    """
    if not filename:
        return "unnamed_image"
    # Strip any directory path components (prevents path traversal)
    base = os.path.basename(filename).strip()
    # Remove null bytes and non-printable characters
    cleaned = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", base)
    if not cleaned:
        return "unnamed_image"
    # Bound length to 255 characters
    return cleaned[:255]


def detect_magic_bytes(header: bytes) -> Optional[Tuple[str, str, str]]:
    """Inspect the first bytes of a file to detect image signatures.
    Returns (format_name, mime_type, extension) or None if unsupported.
    """
    if len(header) < 12:
        return None

    # JPEG: starts with FF D8 FF
    if header.startswith(b"\xff\xd8\xff"):
        return ("JPEG", "image/jpeg", ".jpg")

    # PNG: starts with 89 50 4E 47 0D 0A 1A 0A
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return ("PNG", "image/png", ".png")

    # WEBP: RIFF....WEBP
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return ("WEBP", "image/webp", ".webp")

    return None


def get_absolute_path(storage_key: str, storage_root: Optional[str] = None) -> str:
    """Resolve a relative storage key to an absolute path, ensuring it stays within storage_root."""
    root = os.path.abspath(storage_root or settings.STORAGE_ROOT)
    resolved = os.path.abspath(os.path.join(root, storage_key))
    if not resolved.startswith(root):
        raise StorageError("Path traversal detected in storage key.")
    return resolved


def cleanup_stored_file(storage_key: str, storage_root: Optional[str] = None) -> None:
    """Safely remove a stored file on abort or error without leaking server paths."""
    try:
        path = get_absolute_path(storage_key, storage_root)
        if os.path.exists(path):
            os.remove(path)
            logger.info("Cleaned up orphaned storage file for key: %s", storage_key)
    except Exception as exc:
        logger.warning("Error cleaning up storage file: %s", str(exc))


async def process_and_store_upload(
    upload_stream,
    original_filename: Optional[str],
    storage_root: Optional[str] = None,
    max_size_bytes: Optional[int] = None,
) -> StoredEvidenceMetadata:
    """Stream an uploaded file to secure storage, compute SHA-256, and validate image integrity.
    
    Guarantees:
    - Bounded streaming (no loading full file into memory)
    - Enforced size limit (aborts immediately if limit exceeded)
    - Rejection of empty, malformed, or truncated files
    - SHA-256 computed on exact stored bytes
    - Atomic cleanup on any validation or I/O failure
    """
    root = storage_root or settings.STORAGE_ROOT
    max_bytes = max_size_bytes or (settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024)
    display_filename = sanitize_filename(original_filename)

    evidence_dir = os.path.join(root, "evidence")
    os.makedirs(evidence_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    temp_storage_key = f"evidence/{file_id}.tmp"
    temp_abs_path = get_absolute_path(temp_storage_key, root)

    hasher = hashlib.sha256()
    total_bytes = 0
    header_bytes = b""

    try:
        # Step 1: Bounded streaming write and SHA-256 calculation
        with open(temp_abs_path, "wb") as dest:
            while True:
                chunk = await upload_stream.read(STREAM_CHUNK_SIZE)
                if not chunk:
                    break

                if len(header_bytes) < 32:
                    header_bytes += chunk[: 32 - len(header_bytes)]

                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise FileTooLargeError(
                        f"File exceeds maximum permitted size of {settings.MAX_UPLOAD_SIZE_MB} MB."
                    )

                hasher.update(chunk)
                dest.write(chunk)

        # Check for empty file
        if total_bytes == 0:
            raise InvalidFileError("The uploaded file is empty (0 bytes).")

        # Step 2: Magic Byte inspection
        magic_info = detect_magic_bytes(header_bytes)
        if not magic_info:
            raise UnsupportedMediaTypeError(
                "This image format is not supported.",
                details={"supported_formats": list(ALLOWED_FORMATS.keys())},
            )

        detected_format, detected_mime, extension = magic_info

        # Step 3: Reliable image decoding and dimension verification using Pillow
        try:
            with Image.open(temp_abs_path) as img:
                # Check format matches magic bytes
                if img.format != detected_format:
                    raise UnsupportedMediaTypeError(
                        f"Image format mismatch: signature indicates {detected_format} but parser detected {img.format}."
                    )

                width, height = img.size
                if width <= 0 or height <= 0:
                    raise InvalidFileError("Image dimensions must be greater than zero.")

                if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
                    raise InvalidFileError(
                        f"Image dimensions ({width}x{height}) exceed maximum permitted dimensions ({MAX_IMAGE_WIDTH}x{MAX_IMAGE_HEIGHT})."
                    )

                # Verify image structure and check for truncation/corruption
                img.verify()

        except (DecompressionBombError,):
            raise FileTooLargeError(
                "Image pixel count exceeds safe decompression threshold (potential decompression bomb)."
            )
        except (UnidentifiedImageError, SyntaxError, ValueError, OSError) as exc:
            raise InvalidFileError(
                f"The image file is corrupted, truncated, or could not be decoded: {str(exc)}"
            )

        # Step 4: Finalize file storage with deterministic UUID key
        final_storage_key = f"evidence/{file_id}{extension}"
        final_abs_path = get_absolute_path(final_storage_key, root)

        os.rename(temp_abs_path, final_abs_path)

        computed_sha256 = hasher.hexdigest().lower()

        logger.info(
            "Evidence file stored successfully: key=%s, size=%d bytes, sha256=%s",
            final_storage_key,
            total_bytes,
            computed_sha256,
        )

        return StoredEvidenceMetadata(
            storage_key=final_storage_key,
            original_filename=display_filename,
            file_size_bytes=total_bytes,
            mime_type_detected=detected_mime,
            sha256=computed_sha256,
            width=width,
            height=height,
        )

    except Exception:
        # Ensure temporary file is cleaned up on any failure
        if os.path.exists(temp_abs_path):
            try:
                os.remove(temp_abs_path)
            except OSError:
                pass
        raise
