"""Unit tests for technical image inspector service.
Conforms to docs/AI_SPEC.md Task A and docs/MODEL_EVALUATION.md.
"""

import io
import os
import pytest
from PIL import Image

from app.core.errors import AnalysisUnprocessableError
from app.services.inspector import (
    calculate_aspect_ratio,
    inspect_image_file,
    safe_tag_value,
)


def create_test_image(
    format_name: str = "PNG",
    size: tuple[int, int] = (640, 480),
    color: tuple[int, int, int] = (100, 150, 200),
    exif_data: dict | None = None,
) -> bytes:
    """Generate a clean synthetic image for testing."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()

    if exif_data and format_name.upper() == "JPEG":
        exif = img.getexif()
        for tag_id, val in exif_data.items():
            exif[tag_id] = val
        img.save(buf, format=format_name, exif=exif)
    else:
        img.save(buf, format=format_name)

    return buf.getvalue()


class TestAspectRatios:
    def test_standard_aspect_ratios(self):
        assert calculate_aspect_ratio(1920, 1080) == "16:9"
        assert calculate_aspect_ratio(800, 600) == "4:3"
        assert calculate_aspect_ratio(500, 500) == "1:1"
        assert calculate_aspect_ratio(600, 400) == "3:2"
        assert calculate_aspect_ratio(1080, 1920) == "9:16"

    def test_safe_tag_value(self):
        assert safe_tag_value(b"Canon\x00") == "Canon"
        assert safe_tag_value(123) == "123"
        assert safe_tag_value("Apple iPhone") == "Apple iPhone"


class TestImageInspection:
    def test_inspect_png_without_exif(self, temp_storage_dir):
        raw_bytes = create_test_image("PNG", size=(640, 480))
        file_path = os.path.join(temp_storage_dir, "sample.png")
        with open(file_path, "wb") as f:
            f.write(raw_bytes)

        result = inspect_image_file(file_path, len(raw_bytes), "image/png")

        assert result.label in [
            "low_synthetic_indicators",
            "inconclusive_synthetic_signals",
            "elevated_synthetic_indicators",
            "technical_inspection_completed",
        ]
        if result.ai_forensics and result.ai_forensics.status == "success":
            assert result.score is not None
            assert 0.0 <= result.score <= 1.0
            assert result.score_type == "raw_model_score_synthetic_probability"
            assert result.ai_forensics.model_name == "ai-image-detect-distilled-onnx"
            assert result.ai_forensics.inference_latency_ms is not None
        assert len(result.limitations) >= 4

        ti = result.technical_inspection

        assert ti is not None
        assert ti.dimensions.width == 640
        assert ti.dimensions.height == 480
        assert ti.dimensions.aspect_ratio == "4:3"
        assert ti.dimensions.total_pixels == 307200
        assert ti.format == "PNG"
        assert ti.mode == "RGB"
        assert ti.color_channels == 3
        assert ti.bit_depth == 8
        assert ti.has_transparency is False
        assert ti.metadata_summary.has_exif is False
        assert ti.metadata_summary.gps_status == "not_present"
        assert "Camera Make" in ti.metadata_summary.tags_absent
        assert "Camera Model" in ti.metadata_summary.tags_absent
        assert "social media" in ti.metadata_summary.note.lower()

    def test_inspect_jpeg_with_exif_and_gps_privacy(self, temp_storage_dir):
        # Tag 271: Make, 272: Model, 305: Software, 34853: GPSInfo
        exif_dict = {
            271: "TestCameraCorp",
            272: "ForensicCam-X",
            305: "HavenTestLib 1.0",
            34853: {1: "N", 2: (37, 48, 0)},  # GPS tags
        }
        raw_bytes = create_test_image("JPEG", size=(800, 600), exif_data=exif_dict)
        file_path = os.path.join(temp_storage_dir, "sample_exif.jpg")
        with open(file_path, "wb") as f:
            f.write(raw_bytes)

        result = inspect_image_file(file_path, len(raw_bytes), "image/jpeg")

        ti = result.technical_inspection
        assert ti is not None
        assert ti.format == "JPEG"
        assert ti.metadata_summary.has_exif is True
        assert ti.metadata_summary.tags_present.get("Camera Make") == "TestCameraCorp"
        assert ti.metadata_summary.tags_present.get("Camera Model") == "ForensicCam-X"
        assert ti.metadata_summary.tags_present.get("Software / Processing Tool") == "HavenTestLib 1.0"

        # PRIVACY VERIFICATION: GPS coordinates must be redacted and flagged
        assert ti.metadata_summary.gps_status == "present_redacted_for_privacy"
        assert "GPSInfo" not in ti.metadata_summary.tags_present
        assert "34853" not in ti.metadata_summary.tags_present

        # Verify GPS privacy alert anomaly is generated
        privacy_anomalies = [a for a in ti.anomalies if a.category == "privacy_alert"]
        assert len(privacy_anomalies) == 1
        assert "withheld" in privacy_anomalies[0].description.lower()

    def test_inspect_missing_file_raises_error(self, temp_storage_dir):
        non_existent = os.path.join(temp_storage_dir, "missing.png")
        with pytest.raises(AnalysisUnprocessableError) as exc_info:
            inspect_image_file(non_existent, 100, "image/png")
        assert "could not be located" in str(exc_info.value.message)

    def test_inspect_corrupt_file_raises_error(self, temp_storage_dir):
        corrupt_path = os.path.join(temp_storage_dir, "corrupt.png")
        with open(corrupt_path, "wb") as f:
            f.write(b"not an image file at all")

        with pytest.raises(AnalysisUnprocessableError) as exc_info:
            inspect_image_file(corrupt_path, 24, "image/png")
        assert "could not identify" in str(exc_info.value.message).lower() or "cannot identify" in str(exc_info.value.message).lower()
