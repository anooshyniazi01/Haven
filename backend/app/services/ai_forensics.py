"""Core AI Forensics service for AI-generated image detection.
Executes local inference on CPU using ONNX Runtime with distilled ViT model weights.
Conforms to docs/AI_SPEC.md, docs/MODEL_EVALUATION.md, and docs/SECURITY.md.
"""

import math
import os
from pathlib import Path
import time
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image
import numpy as np

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.analysis import AIForensicsResult

logger = get_logger("services.ai_forensics")

# Standard forensic limitations communicated with all model results
STANDARD_AI_LIMITATIONS: List[str] = [
    "AI detection scores reflect global statistical patterns learned from specific generator families (e.g. Midjourney, Stable Diffusion) and may fail on unseen architectures or localized edits.",
    "Common post-processing such as social messaging recompression (WhatsApp, Telegram), mobile screenshots, resizing, and filters can obscure or distort forensic signals.",
    "A model prediction does not establish creator identity, creation timestamp, or blackmail intent.",
    "Raw probability output is an uncalibrated model estimate, not a guaranteed certainty. It must be interpreted as a decision-support indicator alongside contextual evidence.",
]


class AIForensicsService:
    """Manages local ONNX inference for AI-generated image classification."""

    _instance: Optional["AIForensicsService"] = None

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = Path(model_path or settings.AI_MODEL_PATH)
        self.model_name = settings.AI_MODEL_NAME
        self.model_version = settings.AI_MODEL_VERSION
        self.task = settings.AI_MODEL_TASK

        self._session: Any = None
        self._input_name: Optional[str] = None
        self._output_name: Optional[str] = None
        self._initialized: bool = False
        self._init_error: Optional[str] = None

    @classmethod
    def get_instance(cls, model_path: Optional[str] = None) -> "AIForensicsService":
        """Get or initialize singleton instance."""
        if cls._instance is None:
            cls._instance = cls(model_path=model_path)
            cls._instance.initialize()
        return cls._instance

    def initialize(self) -> bool:
        """Initialize ONNX Runtime inference session on localhost CPU."""
        if self._initialized and self._session is not None:
            return True

        if not self.model_path.exists():
            self._init_error = f"Model checkpoint not found at {self.model_path}"
            logger.warning("AI Forensics unavailable: %s", self._init_error)
            return False

        try:
            import onnxruntime as ort

            # Enforce CPU execution provider exclusively (no CUDA/GPU assumptions)
            opts = ort.SessionOptions()
            opts.intra_op_num_threads = 4
            opts.inter_op_num_threads = 1
            opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

            self._session = ort.InferenceSession(
                str(self.model_path),
                sess_options=opts,
                providers=["CPUExecutionProvider"],
            )

            inputs = self._session.get_inputs()
            outputs = self._session.get_outputs()
            self._input_name = inputs[0].name
            self._output_name = outputs[0].name

            self._initialized = True
            self._init_error = None
            logger.info(
                "AI Forensics initialized successfully: %s v%s (input: %s, output: %s)",
                self.model_name,
                self.model_version,
                self._input_name,
                self._output_name,
            )
            return True

        except Exception as exc:
            self._init_error = f"Failed to initialize ONNX Runtime session: {str(exc)}"
            logger.error("AI Forensics initialization failed: %s", self._init_error, exc_info=True)
            self._session = None
            self._initialized = False
            return False

    def is_available(self) -> bool:
        """Check whether the model is loaded and ready for inference."""
        return self._initialized and self._session is not None

    def preprocess(self, image: Image.Image) -> np.ndarray:
        """Preprocess PIL Image into normalized NCHW float32 tensor [1, 3, 224, 224].

        Preprocessing specifications:
        - Format: RGB (alpha or palette converted)
        - Size: 224x224 via bicubic interpolation
        - Rescaling: pixel / 255.0
        - Normalization: (pixel / 255.0 - 0.5) / 0.5 -> [-1.0, 1.0]
        - Layout: [1, 3, 224, 224] float32
        """
        width, height = image.size
        if width < 64 or height < 64:
            raise ValueError(
                f"Image dimensions ({width}x{height}) are too small for transformer patch tokenization (min 64x64 required)."
            )

        # Convert to 3-channel RGB
        rgb_image = image.convert("RGB")

        # Resize to standard model input dimensions
        resized = rgb_image.resize((224, 224), resample=Image.Resampling.BILINEAR)

        # Convert to numpy array float32 [224, 224, 3]
        arr = np.asarray(resized, dtype=np.float32)

        # Rescale and normalize to [-1.0, 1.0]
        arr = (arr / 255.0 - 0.5) / 0.5

        # Transpose from HWC to CHW
        arr = np.transpose(arr, (2, 0, 1))

        # Add batch dimension: [1, 3, 224, 224]
        tensor = np.expand_dims(arr, axis=0).astype(np.float32)
        return tensor

    def analyze_image(self, image: Image.Image) -> AIForensicsResult:
        """Execute local AI-generated image detection on a PIL Image."""
        if not self.is_available():
            # Attempt lazy initialization in case weights were placed after boot
            if not self.initialize():
                err_msg = self._init_error or "Weights missing"
                return AIForensicsResult(
                    task=self.task,
                    model_name=self.model_name,
                    model_version=self.model_version,
                    model_available=False,
                    inference_status="unavailable",
                    status="unavailable",
                    raw_score=None,
                    synthetic_likelihood=None,
                    score_semantics="Softmax output probability over [fake, real] classes; index 0 represents synthetic probability on [0.0, 1.0] scale.",
                    label="model_unavailable",
                    indicator="model_unavailable",
                    evaluation_status="uncalibrated_raw_model_estimate",
                    inference_latency_ms=None,
                    latency_ms=None,
                    explanation=(
                        f"AI model inference is currently unavailable ({err_msg}). "
                        "Technical image inspection and byte hashing remain active and verified."
                    ),
                    limitations=STANDARD_AI_LIMITATIONS,
                    error_message=err_msg,
                )

        try:
            # Preprocess
            start_time = time.perf_counter()
            tensor = self.preprocess(image)

            # Execute forward inference on CPU
            outputs = self._session.run([self._output_name], {self._input_name: tensor})
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            logits = outputs[0][0]  # shape: [2]
            # Softmax over logits: index 0 = fake, index 1 = real
            exp_logits = np.exp(logits - np.max(logits))
            probs = exp_logits / np.sum(exp_logits)

            fake_prob = float(probs[0])
            real_prob = float(probs[1])

            # Clamp probability between 0.0 and 1.0 and round
            synthetic_score = round(max(0.0, min(1.0, fake_prob)), 4)

            # Assign indicator tiers with conservative false-positive controls
            if synthetic_score >= 0.75:
                label = "elevated_synthetic_indicators"
                explanation = (
                    f"Model inference detected elevated structural and visual feature artifacts consistent with AI synthesis "
                    f"(synthetic score: {synthetic_score:.1%}). This suggests the image may have been generated by an AI synthesis tool. "
                    "This estimate indicates artifact presence and does not establish author identity or intent."
                )
            elif synthetic_score >= 0.25:
                label = "inconclusive_synthetic_signals"
                explanation = (
                    f"Model inference produced ambiguous or mixed feature signals (synthetic score: {synthetic_score:.1%}). "
                    "The visual evidence does not clearly separate synthetic generation from camera capture. "
                    "Heavy compression, screenshotting, or mixed editing may have obscured distinguishing markers."
                )
            else:
                label = "low_synthetic_indicators"
                explanation = (
                    f"Model inference observed visual feature patterns consistent with natural camera acquisition "
                    f"(synthetic score: {synthetic_score:.1%}, natural likelihood: {real_prob:.1%}). "
                    "While strong global generative artifacts were not detected, advanced generation or localized editing cannot be ruled out."
                )

            return AIForensicsResult(
                task=self.task,
                model_name=self.model_name,
                model_version=self.model_version,
                model_available=True,
                inference_status="success",
                status="success",
                raw_score=synthetic_score,
                synthetic_likelihood=synthetic_score,
                score_semantics="Softmax output probability over [fake, real] classes; index 0 represents synthetic probability on [0.0, 1.0] scale.",
                label=label,
                indicator=label,
                evaluation_status="uncalibrated_raw_model_estimate",
                inference_latency_ms=elapsed_ms,
                latency_ms=elapsed_ms,
                explanation=explanation,
                limitations=STANDARD_AI_LIMITATIONS,
                error_message=None,
            )

        except ValueError as val_err:
            logger.warning("Unsupported image for AI forensics: %s", str(val_err))
            return AIForensicsResult(
                task=self.task,
                model_name=self.model_name,
                model_version=self.model_version,
                model_available=self.is_available(),
                inference_status="unsupported_input",
                status="unsupported_input",
                raw_score=None,
                synthetic_likelihood=None,
                score_semantics="Softmax output probability over [fake, real] classes; index 0 represents synthetic probability on [0.0, 1.0] scale.",
                label="unsupported_input",
                indicator="unsupported_input",
                evaluation_status="uncalibrated_raw_model_estimate",
                inference_latency_ms=None,
                latency_ms=None,
                explanation=f"AI forensics input rejected: {str(val_err)}",
                limitations=STANDARD_AI_LIMITATIONS,
                error_message=str(val_err),
            )
        except Exception as exc:
            logger.error("Inference execution failed: %s", str(exc), exc_info=True)
            return AIForensicsResult(
                task=self.task,
                model_name=self.model_name,
                model_version=self.model_version,
                model_available=self.is_available(),
                inference_status="failed",
                status="failed",
                raw_score=None,
                synthetic_likelihood=None,
                score_semantics="Softmax output probability over [fake, real] classes; index 0 represents synthetic probability on [0.0, 1.0] scale.",
                label="inference_failed",
                indicator="inference_failed",
                evaluation_status="uncalibrated_raw_model_estimate",
                inference_latency_ms=None,
                latency_ms=None,
                explanation=f"AI model inference encountered a processing error: {str(exc)}",
                limitations=STANDARD_AI_LIMITATIONS,
                error_message=str(exc),
            )
