# Haven — Architectural Decision Records (ADRs)

This document records the architectural and design decisions made for Haven, particularly concerning the AI Forensics & Image Analysis slice.

---

## ADR-001: Local CPU Inference with Quantized ONNX Runtime

- **Status:** Accepted
- **Context:** Haven is designed as a privacy-first, offline-capable digital safety and forensic analysis platform. Cloud-based computer vision APIs risk leaking sensitive, intimate, or confidential evidence to third parties. Furthermore, users may operate on standard hardware without dedicated GPUs.
- **Decision:** Execute image manipulation detection using a locally hosted, INT8-quantized distilled Vision Transformer model (`ai-image-detect-distilled-onnx`, 14.55 MB) managed through a singleton `AIForensicsService` utilizing `onnxruntime` on CPU.
- **Consequences:**
  - Complete data privacy: evidence images never leave the host machine.
  - Low CPU latency (~80–120 ms per image on standard x86_64 CPU).
  - Minimal memory footprint and no GPU driver requirements.
  - Safe error handling: inference failures or missing checkpoints fail gracefully without crashing the application.

---

## ADR-002: Canonical Shared Response Schema Across All Layers

- **Status:** Accepted
- **Context:** Previously, discrepancies existed between backend field naming (`label`, `inference_latency_ms`, `evaluation_status`), frontend expectations (`indicator`, `latency_ms`), database JSON persistence, and PDF report generation.
- **Decision:** Establish a unified, canonical response model (`AIForensicsResult`) in `app.schemas.analysis` and `types/analysis.ts`. Key fields:
  - `model_name` & `model_version`
  - `model_available` (boolean)
  - `inference_status` ("success" | "unavailable" | "failed" | "unsupported_input")
  - `raw_score` & `synthetic_likelihood` (continuous [0.0, 1.0])
  - `score_semantics`
  - `label` & `indicator` (with bi-directional backward compatibility)
  - `inference_latency_ms` & `latency_ms`
  - `explanation` & `limitations`
  - `evaluation_status`
- **Consequences:** Eliminates runtime contract mismatches, satisfies Pydantic validation, ensures TypeScript type-safety (`tsc --noEmit`), and guarantees that frontend, database records, and PDF exports remain in 100% agreement.

---

## ADR-003: Separation of Observable Technical Inspection from Model Predictions

- **Status:** Accepted
- **Context:** Forensic credibility requires clearly distinguishing verifiable digital facts (file headers, pixel dimensions, EXIF tags, compression ratio, byte hashing) from statistical model predictions (synthetic likelihood).
- **Decision:** Maintain separate, decoupled inspection modules (`inspector.py` and `ai_forensics.py`). In the API response, frontend UI, and PDF report, `technical_inspection` and `ai_forensics` are rendered in independent, dedicated sections.
- **Consequences:** Users and investigators can verify deterministic file properties regardless of AI model availability or classification confidence. AI model failure does not invalidate technical inspection data.

---

## ADR-004: Explicit Uncalibrated Evaluation Status and Safe Interpretation Semantics

- **Status:** Accepted
- **Context:** AI synthetic-image detectors exhibit significant variance across different generative architectures (e.g. Midjourney, Stable Diffusion, FLUX), recompression stages, and social media downscaling. Presenting raw softmax scores as calibrated probabilities or legal proof of authenticity is scientifically invalid and harmful.
- **Decision:**
  - Mark model output evaluation status as `"uncalibrated_raw_model_estimate"`.
  - Prohibit binary claims such as "100% genuine" or "proven AI fake".
  - Use cautious, probabilistic tiers:
    - `>= 0.75`: `elevated_synthetic_indicators`
    - `0.25 <= score < 0.75`: `inconclusive_synthetic_signals`
    - `< 0.25`: `low_synthetic_indicators`
  - Accompany every score with plain-language explanations, model limitations, and disclaimer notes.
- **Consequences:** Prevents misrepresentation of forensic evidence while offering actionable, honest investigative signals.

---

## ADR-005: Privacy-Preserving Geolocation Redaction

- **Status:** Accepted
- **Context:** User evidence images may contain sensitive GPS coordinates in EXIF headers (e.g. domestic violence survivors, whistleblowers, personal devices). Exposing raw coordinates in ordinary UI cards, application logs, or shareable forensic reports poses safety risks.
- **Decision:** Extract GPS presence safely in `inspector.py`, sanitize exact latitude/longitude/altitude values, and output `gps_status: "present_redacted_for_privacy"`.
- **Consequences:** Protects user physical safety while retaining the forensic fact that geolocation tags were recorded in the original image.

---

## ADR-006: Reproducible Offline Evaluation Runner (ModelEvaluator)

- **Status:** Accepted
- **Context:** Project requirements dictate that model accuracy must be evaluated using a structured, documented evaluation pipeline rather than ad-hoc claims or fabricated benchmarks.
- **Decision:** Implement `app.services.evaluator.ModelEvaluator` supporting structured `DatasetManifest` inputs. The engine computes confusion matrices (TP, FP, TN, FN), accuracy, precision, recall, specificity, F1 score, false-positive/negative rates, and exact ROC-AUC via the Wilcoxon-Mann-Whitney rank statistic with zero external dependencies.
- **Consequences:** Provides a rigorous, automated tool for evaluating newly sourced or fine-tuned forensic checkpoints on labelled datasets while clearly labeling unverified models as unevaluated.
