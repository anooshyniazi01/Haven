"""Technical image inspection and metadata analysis service.
Conforms to docs/AI_SPEC.md Task A, docs/MODEL_EVALUATION.md Section 15, and docs/SECURITY.md.
"""

from fractions import Fraction
import json
import math
import os
from typing import Any, Dict, List, Optional, Tuple
from PIL import ExifTags, Image, UnidentifiedImageError

from app.core.errors import AnalysisUnprocessableError
from app.core.logging import get_logger
from app.schemas.analysis import (
    AIForensicsResult,
    AnalysisResult,
    AnomalyFinding,
    DimensionsInfo,
    MetadataSummary,
    TechnicalInspectionResult,
)
from app.services.ai_forensics import AIForensicsService

logger = get_logger("services.inspector")


# List of safe EXIF tag names allowed in non-sensitive inspection summary
SAFE_EXIF_TAGS = {
    "Make": "Camera Make",
    "Model": "Camera Model",
    "Software": "Software / Processing Tool",
    "DateTime": "Modification Timestamp",
    "DateTimeOriginal": "Original Capture Timestamp",
    "Orientation": "Image Orientation",
    "XResolution": "Horizontal Resolution",
    "YResolution": "Vertical Resolution",
    "ResolutionUnit": "Resolution Unit",
    "ColorSpace": "Color Space",
}

# GPS Info Tag ID
EXIF_GPS_TAG_ID = 34853


def calculate_aspect_ratio(width: int, height: int) -> str:
    """Calculate a human-readable aspect ratio."""
    if width <= 0 or height <= 0:
        return "Unknown"

    # Check common photography and video aspect ratios
    ratio = width / height
    common_ratios = [
        (1.0, "1:1"),
        (4 / 3, "4:3"),
        (3 / 2, "3:2"),
        (16 / 9, "16:9"),
        (16 / 10, "16:10"),
        (5 / 4, "5:4"),
        (9 / 16, "9:16"),
        (3 / 4, "3:4"),
        (2 / 3, "2:3"),
    ]
    for target, label in common_ratios:
        if math.isclose(ratio, target, rel_tol=0.03):
            return label

    # Try simplifying fraction up to limit
    try:
        frac = Fraction(width, height).limit_denominator(20)
        return f"{frac.numerator}:{frac.denominator}"
    except Exception:
        return f"{ratio:.2f}:1"


def safe_tag_value(value: Any) -> str:
    """Convert an arbitrary EXIF tag value to a safe printable string."""
    if isinstance(value, bytes):
        try:
            return value.decode("utf-8", errors="replace").strip("\x00 \t\r\n")
        except Exception:
            return f"<binary data: {len(value)} bytes>"
    if isinstance(value, (int, float, str)):
        return str(value).strip()
    if hasattr(value, "numerator") and hasattr(value, "denominator"):
        # Handle IFDRational
        if value.denominator != 0:
            return f"{value.numerator / value.denominator:.2f}"
        return f"{value.numerator}/{value.denominator}"
    return str(value)


def inspect_image_file(
    file_path: str,
    file_size_bytes: int,
    detected_mime: str,
) -> AnalysisResult:
    """Perform deterministic technical inspection and metadata extraction on an image file.

    Guarantees:
    - Never fabricates scores or simulated AI classifications
    - Distinguishes observed facts from interpretations
    - Safeguards privacy by redacting raw GPS coordinates
    - Identifies missing metadata without falsely equating absence to manipulation
    - Handles corrupted or truncated files safely
    """
    if not os.path.exists(file_path):
        raise AnalysisUnprocessableError(
            f"Evidence file could not be located on storage."
        )

    try:
        with Image.open(file_path) as img:
            format_name = img.format or "UNKNOWN"
            mode = img.mode or "UNKNOWN"
            width, height = img.size

            if width <= 0 or height <= 0:
                raise AnalysisUnprocessableError("Image dimensions must be positive.")

            aspect_ratio = calculate_aspect_ratio(width, height)
            total_pixels = width * height
            megapixels = round(total_pixels / 1_000_000, 2)

            # Color channels and bit depth
            mode_channel_map = {
                "1": (1, 1),
                "L": (1, 8),
                "P": (1, 8),
                "RGB": (3, 8),
                "RGBA": (4, 8),
                "CMYK": (4, 8),
                "YCbCr": (3, 8),
                "LAB": (3, 8),
                "HSV": (3, 8),
                "I": (1, 32),
                "F": (1, 32),
            }
            channels, bit_depth = mode_channel_map.get(mode, (3, 8))
            has_transparency = "A" in mode or (
                mode == "P" and "transparency" in img.info
            )
            color_profile_present = bool(img.info.get("icc_profile"))

            # Compression assessment
            raw_uncompressed_bytes = total_pixels * (channels if bit_depth == 8 else (channels * (bit_depth // 8)))
            compression_ratio = (
                round(raw_uncompressed_bytes / file_size_bytes, 2)
                if file_size_bytes > 0
                else 1.0
            )

            # Metadata and EXIF inspection
            exif_present_tags: Dict[str, Any] = {}
            gps_status = "not_present"
            has_exif = False

            try:
                raw_exif = img.getexif()
                if raw_exif:
                    has_exif = True
                    for tag_id, value in raw_exif.items():
                        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                        # Privacy safeguard: check for GPS tags without logging coordinates
                        if tag_id == EXIF_GPS_TAG_ID or tag_name == "GPSInfo":
                            gps_status = "present_redacted_for_privacy"
                            continue

                        if tag_name in SAFE_EXIF_TAGS:
                            display_name = SAFE_EXIF_TAGS[tag_name]
                            exif_present_tags[display_name] = safe_tag_value(value)

            except Exception as exif_err:
                logger.warning("Error reading EXIF data: %s", str(exif_err))
                has_exif = False

            # Check standard missing metadata
            standard_expectations = [
                ("Camera Make", "Camera Make"),
                ("Camera Model", "Camera Model"),
                ("Original Capture Timestamp", "Capture Timestamp"),
                ("Software / Processing Tool", "Software / Editing Tag"),
            ]
            tags_absent = [
                label for key, label in standard_expectations if key not in exif_present_tags
            ]

            metadata_note = (
                "Missing metadata is standard on modern communication and social media platforms "
                "(such as WhatsApp, Instagram, X/Twitter, Signal, and Telegram), which strip EXIF data on upload "
                "to protect user privacy. The absence of EXIF metadata does NOT indicate an image is manipulated, synthetic, or fake."
            )

            metadata_summary = MetadataSummary(
                has_exif=has_exif,
                tags_present=exif_present_tags,
                tags_absent=tags_absent,
                gps_status=gps_status,
                note=metadata_note,
            )

            # Anomalies and consistency checks
            anomalies: List[AnomalyFinding] = []

            # Check format vs mode sanity
            if format_name == "JPEG" and "A" in mode:
                anomalies.append(
                    AnomalyFinding(
                        category="mode_format_consistency",
                        description="JPEG format does not standardly support alpha transparency channels.",
                        severity="warning",
                    )
                )

            # Check for GPS tags present
            if gps_status == "present_redacted_for_privacy":
                anomalies.append(
                    AnomalyFinding(
                        category="privacy_alert",
                        description="GPS geolocation tags were detected in the file metadata. For your safety and privacy, raw coordinates are withheld from standard analysis displays.",
                        severity="info",
                    )
                )

            # Check file structure markers (EOF verification)
            try:
                with open(file_path, "rb") as f:
                    file_bytes = f.read()

                if format_name == "JPEG":
                    # Check for EOI marker FF D9
                    eoi_pos = file_bytes.rfind(b"\xff\xd9")
                    if eoi_pos == -1:
                        anomalies.append(
                            AnomalyFinding(
                                category="structural_integrity",
                                description="Standard JPEG End-of-Image (EOI) marker was not found at expected position.",
                                severity="warning",
                            )
                        )
                    elif eoi_pos < len(file_bytes) - 2:
                        trailing_len = len(file_bytes) - (eoi_pos + 2)
                        if trailing_len > 128:  # ignore minor padding
                            anomalies.append(
                                AnomalyFinding(
                                    category="structural_integrity",
                                    description=f"Detected {trailing_len} trailing bytes after the standard JPEG End-of-Image marker.",
                                    severity="info",
                                )
                            )

                elif format_name == "PNG":
                    # Check for standard IEND chunk
                    if b"IEND" not in file_bytes[-32:]:
                        anomalies.append(
                            AnomalyFinding(
                                category="structural_integrity",
                                description="Standard PNG IEND termination chunk was not found near the end of the file.",
                                severity="warning",
                            )
                        )
            except Exception as read_err:
                logger.warning("Error performing EOF marker check: %s", str(read_err))

            # Assemble Dimensions
            dimensions = DimensionsInfo(
                width=width,
                height=height,
                aspect_ratio=aspect_ratio,
                total_pixels=total_pixels,
                megapixels=megapixels,
            )

            # Execute local AI-generated image forensics (Task A)
            ai_service = AIForensicsService.get_instance()
            ai_res: AIForensicsResult = ai_service.analyze_image(img)

            if ai_res.status == "success":
                ai_status = (
                    f"{ai_res.model_name} (v{ai_res.model_version}): Execution completed. "
                    f"Synthetic likelihood estimate: {ai_res.synthetic_likelihood:.1%} ({ai_res.label}). "
                    f"Local CPU latency: {ai_res.inference_latency_ms} ms."
                )
            elif ai_res.status == "unavailable":
                ai_status = (
                    f"Model-based AI synthetic detection is currently unavailable ({ai_res.explanation}). "
                    "Deterministic technical image inspection and cryptographic integrity verification executed."
                )
            elif ai_res.status == "unsupported_input":
                ai_status = f"AI synthetic detection input rejected: {ai_res.explanation}"
            else:
                ai_status = f"AI synthetic detection inference failed: {ai_res.explanation}"

            inspection_result = TechnicalInspectionResult(
                dimensions=dimensions,
                format=format_name,
                mime_type=detected_mime,
                mode=mode,
                color_channels=channels,
                bit_depth=bit_depth,
                has_transparency=has_transparency,
                color_profile_present=color_profile_present,
                file_size_bytes=file_size_bytes,
                compression_ratio=compression_ratio,
                metadata_summary=metadata_summary,
                anomalies=anomalies,
                ai_model_status=ai_status,
            )

            # Determine label, score, and score_type
            has_warnings = any(a.severity == "warning" for a in anomalies)
            if ai_res.status == "success":
                result_label = ai_res.label or "technical_inspection_completed"
                score = ai_res.synthetic_likelihood
                score_type = "raw_model_score_synthetic_probability"
            else:
                result_label = (
                    "format_anomalies_detected"
                    if has_warnings
                    else "technical_inspection_completed"
                )
                score = None
                score_type = None

            # Build honest plain-English explanation
            meta_status_text = (
                f"EXIF metadata was detected with {len(exif_present_tags)} recorded tags."
                if has_exif and exif_present_tags
                else "No EXIF camera or software metadata was detected."
            )

            explanation = (
                f"Technical inspection verified a {format_name} image with dimensions {width}x{height} "
                f"({aspect_ratio}, {megapixels} MP) in {mode} color mode ({bit_depth}-bit, {channels} channels). "
                f"Stored file size is {file_size_bytes:,} bytes with an estimated raw-to-compressed ratio of {compression_ratio}:1. "
                f"{meta_status_text} "
                f"{'Structural inspection noted potential format irregularities.' if has_warnings else 'Image structure parsed without structural corruption.'}"
            )
            if ai_res.status == "success" and ai_res.explanation:
                explanation += f" AI Forensics finding: {ai_res.explanation}"
            elif ai_res.status == "unavailable":
                explanation += " Model-based AI synthetic detection was unavailable."

            limitations = [
                "Technical image inspection measures observable digital properties and file encoding. It does not identify the person who created or edited an image.",
                "The presence or absence of EXIF metadata is not proof of authenticity or manipulation. Modern communication and social media platforms routinely strip metadata.",
                "File byte hashing (SHA-256) verifies that stored bytes match a recorded digest; it does not establish image provenance, creation time, or chain of custody.",
                "No automated forensic tool can independently determine whether an image is genuine or fraudulent.",
            ]
            if ai_res.limitations:
                for lim in ai_res.limitations:
                    if lim not in limitations:
                        limitations.append(lim)

            return AnalysisResult(
                label=result_label,
                score=score,
                score_type=score_type,
                explanation=explanation,
                limitations=limitations,
                technical_inspection=inspection_result,
                ai_forensics=ai_res,
            )


    except UnidentifiedImageError as exc:
        raise AnalysisUnprocessableError(
            f"Image parser could not identify image format: {str(exc)}"
        )
    except Exception as exc:
        logger.error("Failed to inspect image file: %s", str(exc), exc_info=True)
        raise AnalysisUnprocessableError(
            f"Failed to inspect image properties: {str(exc)}"
        )
