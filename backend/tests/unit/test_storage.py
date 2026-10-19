"""Unit tests for storage service, magic byte detection, and hashing."""

import io
import os
import pytest
from PIL import Image

from app.core.errors import (
    FileTooLargeError,
    InvalidFileError,
    StorageError,
    UnsupportedMediaTypeError,
)
from app.services.storage import (
    cleanup_stored_file,
    detect_magic_bytes,
    get_absolute_path,
    process_and_store_upload,
    sanitize_filename,
)


class AsyncBytesStream:
    """Mock async stream mimicking FastAPI UploadFile."""

    def __init__(self, data: bytes):
        self._io = io.BytesIO(data)

    async def read(self, size: int = -1) -> bytes:
        return self._io.read(size)


def create_synthetic_image(fmt: str = "JPEG", size=(50, 50)) -> bytes:
    """Create a synthetic in-memory image for testing without sensitive data."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=(36, 91, 79))
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_sanitize_filename():
    assert sanitize_filename("test.jpg") == "test.jpg"
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("C:\\Windows\\System32\\calc.exe") == "calc.exe"
    assert sanitize_filename("bad\x00name.png") == "badname.png"
    assert sanitize_filename("") == "unnamed_image"
    assert sanitize_filename(None) == "unnamed_image"
    long_name = "a" * 300 + ".jpg"
    assert len(sanitize_filename(long_name)) == 255


def test_detect_magic_bytes():
    jpeg_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 20
    assert detect_magic_bytes(jpeg_bytes) == ("JPEG", "image/jpeg", ".jpg")

    png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 20
    assert detect_magic_bytes(png_bytes) == ("PNG", "image/png", ".png")

    webp_bytes = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 20
    assert detect_magic_bytes(webp_bytes) == ("WEBP", "image/webp", ".webp")

    text_bytes = b"Hello, this is just plain text!"
    assert detect_magic_bytes(text_bytes) is None

    short_bytes = b"short"
    assert detect_magic_bytes(short_bytes) is None


@pytest.mark.asyncio
async def test_process_and_store_upload_valid_jpeg(temp_storage_dir: str):
    raw_data = create_synthetic_image("JPEG")
    stream = AsyncBytesStream(raw_data)

    meta = await process_and_store_upload(
        upload_stream=stream,
        original_filename="sample_test.jpg",
        storage_root=temp_storage_dir,
    )

    assert meta.mime_type_detected == "image/jpeg"
    assert meta.file_size_bytes == len(raw_data)
    assert meta.original_filename == "sample_test.jpg"
    assert len(meta.sha256) == 64

    # Verify physical file existence and contents
    stored_path = get_absolute_path(meta.storage_key, temp_storage_dir)
    assert os.path.exists(stored_path)
    with open(stored_path, "rb") as f:
        stored_bytes = f.read()
    assert stored_bytes == raw_data


@pytest.mark.asyncio
async def test_process_and_store_upload_valid_png(temp_storage_dir: str):
    raw_data = create_synthetic_image("PNG")
    stream = AsyncBytesStream(raw_data)

    meta = await process_and_store_upload(
        upload_stream=stream,
        original_filename="sample_test.png",
        storage_root=temp_storage_dir,
    )

    assert meta.mime_type_detected == "image/png"
    assert meta.file_size_bytes == len(raw_data)


@pytest.mark.asyncio
async def test_process_and_store_upload_valid_webp(temp_storage_dir: str):
    raw_data = create_synthetic_image("WEBP")
    stream = AsyncBytesStream(raw_data)

    meta = await process_and_store_upload(
        upload_stream=stream,
        original_filename="sample_test.webp",
        storage_root=temp_storage_dir,
    )

    assert meta.mime_type_detected == "image/webp"
    assert meta.file_size_bytes == len(raw_data)


@pytest.mark.asyncio
async def test_process_and_store_upload_empty_file(temp_storage_dir: str):
    stream = AsyncBytesStream(b"")
    with pytest.raises(InvalidFileError) as exc_info:
        await process_and_store_upload(
            upload_stream=stream,
            original_filename="empty.jpg",
            storage_root=temp_storage_dir,
        )
    assert "empty" in exc_info.value.message.lower()


@pytest.mark.asyncio
async def test_process_and_store_upload_file_too_large(temp_storage_dir: str):
    # Set limit to 100 bytes and pass 200 bytes
    stream = AsyncBytesStream(b"A" * 200)
    with pytest.raises(FileTooLargeError) as exc_info:
        await process_and_store_upload(
            upload_stream=stream,
            original_filename="big.jpg",
            storage_root=temp_storage_dir,
            max_size_bytes=100,
        )
    assert exc_info.value.status_code == 413


@pytest.mark.asyncio
async def test_process_and_store_upload_unsupported_format(temp_storage_dir: str):
    # Plain text file disguised as image
    stream = AsyncBytesStream(b"Disguised file content that is not an image.")
    with pytest.raises(UnsupportedMediaTypeError) as exc_info:
        await process_and_store_upload(
            upload_stream=stream,
            original_filename="fake.jpg",
            storage_root=temp_storage_dir,
        )
    assert exc_info.value.status_code == 415


@pytest.mark.asyncio
async def test_process_and_store_upload_corrupt_image(temp_storage_dir: str):
    # JPEG magic bytes followed by garbage data
    corrupted_data = b"\xff\xd8\xff\xe0" + b"\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00corrupted garbage data"
    stream = AsyncBytesStream(corrupted_data)
    with pytest.raises(InvalidFileError) as exc_info:
        await process_and_store_upload(
            upload_stream=stream,
            original_filename="corrupted.jpg",
            storage_root=temp_storage_dir,
        )
    assert exc_info.value.status_code == 400


def test_get_absolute_path_traversal_prevention(temp_storage_dir: str):
    with pytest.raises(StorageError):
        get_absolute_path("../../secret.txt", temp_storage_dir)


def test_cleanup_stored_file(temp_storage_dir: str):
    test_file = os.path.join(temp_storage_dir, "test.txt")
    with open(test_file, "w") as f:
        f.write("test")
    assert os.path.exists(test_file)

    cleanup_stored_file("test.txt", temp_storage_dir)
    assert not os.path.exists(test_file)
