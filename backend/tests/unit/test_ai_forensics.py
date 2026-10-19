"""Unit tests for Core AI Forensics service (Task A: Synthetic Image Detection).
Conforms to docs/AI_SPEC.md, docs/MODEL_EVALUATION.md, and docs/SECURITY.md.
"""

import os
from pathlib import Path
import numpy as np
from PIL import Image
import pytest

from app.services.ai_forensics import AIForensicsService, STANDARD_AI_LIMITATIONS


@pytest.fixture
def test_image_rgb() -> Image.Image:
    """Create a standard test RGB image."""
    return Image.new("RGB", (256, 256), color=(128, 64, 32))


@pytest.fixture
def tiny_image() -> Image.Image:
    """Create an image below the 64x64 minimum threshold."""
    return Image.new("RGB", (32, 32), color=(255, 0, 0))


class TestAIForensicsService:
    def test_singleton_instance(self):
        instance1 = AIForensicsService.get_instance()
        instance2 = AIForensicsService.get_instance()
        assert instance1 is instance2

    def test_model_availability(self):
        svc = AIForensicsService.get_instance()
        # On this workstation, model is downloaded to D:\haven_models
        assert svc.is_available() is True
        assert svc.model_name == "ai-image-detect-distilled-onnx"
        assert svc.model_version == "1.0.0"
        assert svc.task == "ai_generated_image_detection"

    def test_preprocessing_output_shape_and_bounds(self, test_image_rgb):
        svc = AIForensicsService.get_instance()
        tensor = svc.preprocess(test_image_rgb)

        assert isinstance(tensor, np.ndarray)
        assert tensor.shape == (1, 3, 224, 224)
        assert tensor.dtype == np.float32
        # Normalization (x/255 - 0.5)/0.5 produces values within [-1.0, 1.0]
        assert np.all(tensor >= -1.0)
        assert np.all(tensor <= 1.0)

    def test_preprocessing_rejects_sub_64px_image(self, tiny_image):
        svc = AIForensicsService.get_instance()
        with pytest.raises(ValueError, match="too small"):
            svc.preprocess(tiny_image)

    def test_analyze_unsupported_small_image_returns_structured_result(self, tiny_image):
        svc = AIForensicsService.get_instance()
        res = svc.analyze_image(tiny_image)

        assert res.status == "unsupported_input"
        assert res.label == "unsupported_input"
        assert res.raw_score is None
        assert res.synthetic_likelihood is None
        assert "too small" in res.explanation
        assert len(res.limitations) == len(STANDARD_AI_LIMITATIONS)

    def test_missing_model_path_handled_gracefully(self, test_image_rgb, tmp_path):
        non_existent_path = tmp_path / "missing_model.onnx"
        unavail_svc = AIForensicsService(model_path=str(non_existent_path))
        assert unavail_svc.initialize() is False
        assert unavail_svc.is_available() is False

        res = unavail_svc.analyze_image(test_image_rgb)
        assert res.status == "unavailable"
        assert res.label == "model_unavailable"
        assert res.raw_score is None
        assert res.synthetic_likelihood is None
        assert "unavailable" in res.explanation

    def test_live_inference_on_sample_image(self):
        svc = AIForensicsService.get_instance()
        sample_path = Path("scratch/sample_inspection_image.jpg")
        if not sample_path.exists():
            # Check relative to backend root
            sample_path = Path("backend/scratch/sample_inspection_image.jpg")

        if sample_path.exists():
            with Image.open(sample_path) as img:
                res = svc.analyze_image(img)

                assert res.status == "success"
                assert res.model_name == "ai-image-detect-distilled-onnx"
                assert res.raw_score is not None
                assert 0.0 <= res.raw_score <= 1.0
                assert res.synthetic_likelihood == res.raw_score
                assert res.label in [
                    "low_synthetic_indicators",
                    "inconclusive_synthetic_signals",
                    "elevated_synthetic_indicators",
                ]
                assert res.evaluation_status == "uncalibrated_raw_model_estimate"
                assert res.inference_latency_ms is not None
                assert res.inference_latency_ms > 0
                assert res.inference_latency_ms < 1000  # CPU inference must be sub-second
                assert len(res.limitations) == 4
