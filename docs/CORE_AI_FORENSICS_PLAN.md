# Haven — Core AI Forensics Implementation Plan

**Status:** Implementation Blueprint  
**Target Feature:** Task A — AI-Generated (Synthetic) Image Detection  
**Engine:** ONNX Runtime CPU with Quantized UniversalFakeDetect Architecture  
**Governing Documents:** [`AGENTS.md`](file:///C:/Users/LENOVO/OneDrive/Desktop/Haven/AGENTS.md), [`docs/AI_SPEC.md`](file:///C:/Users/LENOVO/OneDrive/Desktop/Haven/docs/AI_SPEC.md), [`docs/MODEL_EVALUATION.md`](file:///C:/Users/LENOVO/OneDrive/Desktop/Haven/docs/MODEL_EVALUATION.md), [`docs/AI_FEASIBILITY_RESEARCH.md`](file:///C:/Users/LENOVO/OneDrive/Desktop/Haven/docs/AI_FEASIBILITY_RESEARCH.md)

---

## 1. Selected Detection Task & Forensic Scope

### A. Task Definition
Haven will implement **AI-Generated Image Detection (Synthetic Media Classification)** as its core AI-forensics capability.

* **Exact Question Addressed:** *"Does this image exhibit structural, latent, and visual embedding patterns characteristic of AI-generated synthetic images (Diffusion models, GANs), rather than physical camera sensor acquisitions?"*
* **Forensic Boundaries & What It Does NOT Claim:**
  * It does **not** prove an image is genuine or authentic.
  * It does **not** detect localized face-swaps or manual photo-editing splices on authentic photos.
  * It does **not** identify who created the image, what software generated it, or why it was made.
  * It does **not** prove legal culpability or blackmail intent.

### B. Core Philosophy: Anomaly Indicator, Not Authenticity Oracle
Outputs must be reported as **probabilistic artifact measurements** accompanied by a structured uncertainty tier. The interface must communicate that AI detection is a decision-support signal, not an authoritative verdict.

---

## 2. Proposed Architectural Design

```
                                  [ Uploaded / Preserved Image ]
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │ Input Validation &    │
                                    │ Magic Byte Inspection │
                                    └───────────┬───────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        ┌───────────────────────────────┐               ┌─────────────────────────────────┐
        │  Technical Image Inspector    │               │  Core AI Forensics Service      │
        │  (Pillow / Standard Lib)      │               │  (ONNX Runtime CPU Engine)      │
        ├───────────────────────────────┤               ├─────────────────────────────────┤
        │ • Geometry (W, H, MP, Ratio)  │               │ • RGB Normalization & Resizing  │
        │ • Color Mode & Bit Depth      │               │ • Frozen ViT-B/16 Vision Trunk  │
        │ • EXIF Metadata & Safe Tags   │               │ • Linear Probe Classification   │
        │ • GPS Privacy Redaction       │               │ • Sigmoid & Temperature Scaling │
        │ • Structural Markers (EOF)    │               │ • Uncertainty Tier Assignment   │
        └──────────────┬────────────────┘               └────────────────┬────────────────┘
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │ Aggregated Forensic Result      │
                               │ • Deterministic Properties      │
                               │ • Synthetic Likelihood Score    │
                               │ • Uncertainty & Disclaimers     │
                               └────────────────┬────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        ┌───────────────────────────────┐               ┌─────────────────────────────────┐
        │ Database Persistence (SQLite) │               │ Downstream Consumers            │
        │ • analyses.model_name         │               │ • ImageAnalyzer React View      │
        │ • analyses.result_score       │               │ • Evidence Vault Detail View    │
        │ • analyses.score_type         │               │ • Standalone PDF Export         │
        │ • analyses.technical_details  │               │                                 │
        └───────────────────────────────┘               └─────────────────────────────────┘
```

### A. Preprocessing Pipeline
1. **Aspect-Ratio Preserving Resize:** Resize the input image so its shortest edge is 224 pixels, preventing distortion of geometric features.
2. **Center Crop:** Extract a $224 \times 224$ center patch.
3. **RGB Normalization:** Normalize pixel channels using standard OpenAI CLIP mean `[0.48145466, 0.4578275, 0.40821073]` and standard deviation `[0.26862954, 0.26130258, 0.27577711]`.
4. **Dimension Layout:** Format tensor as NCHW float32 `[1, 3, 224, 224]`.

### B. Inference Runtime: ONNX Runtime CPU
* **Adapter Class:** `backend/app/services/ai_forensics.py` encapsulating an `AIModelAdapter` interface.
* **Checkpoint:** INT8-quantized UniversalFakeDetect model (`ufd_clip_vitb16_int8.onnx`, **~85 MB**).
* **Execution:** Direct execution via `onnxruntime.InferenceSession(providers=['CPUExecutionProvider'])`. Zero CUDA or GPU driver requirements.

---

## 3. Data Contract & Schema Alignment

The existing SQLite database schema and API Pydantic schemas were designed in Phase 5 to anticipate model integration without requiring destructive migrations.

### A. Database Model Mapping ([`analyses` Table](file:///C:/Users/LENOVO/OneDrive/Desktop/Haven/backend/app/db/models/analysis.py))
* `analysis_method`: `"technical_and_ai_synthetic_inspection"`
* `model_name`: `"UniversalFakeDetect-ViT-B16-INT8"`
* `model_version`: `"1.0.0-onnx"`
* `result_score`: `0.87` (calibrated probability score from 0.00 to 1.00)
* `score_type`: `"calibrated_synthetic_likelihood"`
* `result_label`: `"elevated_synthetic_indicators"` | `"inconclusive_synthetic_signals"` | `"low_synthetic_indicators"`
* `explanation`: Grounded forensic summary combining observed geometry, metadata status, and synthetic likelihood tier.
* `limitations_json`: Serialized JSON array of forensic limitations.
* `technical_details_json`: Serialized JSON containing both `technical_inspection` and a new `ai_forensics` block:
  ```json
  {
    "dimensions": { "width": 1920, "height": 1080, ... },
    "ai_forensics": {
      "model_identifier": "UniversalFakeDetect-ViT-B16-INT8",
      "model_version": "1.0.0-onnx",
      "raw_logit": 2.14,
      "calibrated_likelihood": 0.87,
      "decision_threshold": 0.75,
      "uncertainty_tier": "elevated_indicators",
      "inference_latency_ms": 112,
      "calibration_method": "platt_scaling_validation_split"
    }
  }
  ```

---

## 4. Decision Thresholds & Tiered Uncertainty Framework

Raw sigmoid outputs must never be presented as absolute truth. To protect users from false accusations or false reassurance, Haven implements a **Three-Tier Uncertainty Framework**:

```
0.00                              0.25                         0.75                              1.00
[────── Low Synthetic Signal ──────][── Inconclusive / Mixed ──][── Elevated Synthetic Signal ──]
  Consistent with natural capture     Ambiguous feature traces    Structural artifacts consistent
  (Advanced AI not ruled out)         (Recompression noise)       with synthetic generation
```

| Score Range | Category Label | Meaning & Forensic Interpretation | User-Facing Guidance |
|---|---|---|---|
| **0.00 – 0.25** | `low_synthetic_indicators` | The model observed feature distributions consistent with natural physical camera sensors. | *The image does not show strong global AI synthesis artifacts. However, localized manual editing, face-swapping, or newer unbenchmarked generators cannot be excluded.* |
| **0.26 – 0.74** | `inconclusive_synthetic_signals` | Feature indicators are ambiguous, or compression artifacts have obscured forensic traces. | *Forensic analysis is inconclusive. Severe social media recompression or mixed visual elements prevent a confident distinction. Do not base safety decisions on this result.* |
| **0.75 – 1.00** | `elevated_synthetic_indicators` | The model observed significant structural and feature-space artifacts characteristic of synthetic generators. | *Elevated artifacts consistent with AI synthesis were detected. While this suggests the image may be AI-generated, it does not prove malicious intent or who generated it.* |

### Threshold Selection Rationalization
* **Conservative False-Positive Bias:** In blackmail defense, a false positive (falsely assuring a victim that a real extortion photo is fake, or falsely accusing a sender) can have dangerous real-world consequences. The threshold for "Elevated Indicators" is deliberately set conservatively at **0.75** (rather than 0.50), prioritizing high precision over raw recall.
* **Abstention Policy:**
  * Images smaller than $64 \times 64$ pixels are rejected as `unsupported_input` (insufficient spatial features for ViT patch tokenization).
  * If the model file is missing or inference throws an unhandled exception, the pipeline gracefully falls back to deterministic technical inspection with `ai_model_status = "Inference engine failed; technical inspection preserved"`.

---

## 5. End-to-End Vertical Slice Integration Sequence

The implementation of Core AI Forensics will follow Haven's mandatory vertical slicing discipline:

```
[Prerequisite: Disk Space Recovery]
                │
                ▼
┌────────────────────────────────────────────────────────┐
│ Step 1: Model Serialization & ONNX Export Pipeline     │
│ - Export frozen CLIP ViT-B/16 + UFD linear probe       │
│ - Apply INT8 dynamic quantization (~85 MB)             │
│ - Validate numerical parity against PyTorch original   │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 2: Backend Inference Service                      │
│ - Install onnxruntime in uv environment                │
│ - Implement backend/app/services/ai_forensics.py       │
│ - Implement preprocessor and calibration function      │
│ - Unit test inference with known test fixtures         │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 3: Analysis Pipeline & API Integration            │
│ - Connect ai_forensics service into inspector.py       │
│ - Populate model_name, score, and ai_forensics schema  │
│ - Update integration tests in test_analysis_routes.py  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 4: Frontend UI Updates (ImageAnalyzer.tsx)        │
│ - Render Synthetic Likelihood Meter & Uncertainty Badge│
│ - Display model provenance and forensic context card   │
│ - Add comprehensive accessibility tests in Vitest      │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 5: PDF Export Integration (pdf_exporter.py)       │
│ - Update Section 4 from "Unavailable" to live score    │
│ - Render calibration metadata and mandatory disclaimers│
│ - Verify 0-disk in-memory streaming with full tests    │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 6: End-to-End Live Verification & Documentation   │
│ - Run full backend & frontend automated test suites    │
│ - Verify in-browser via browser_subagent               │
│ - Update docs/MODEL_EVALUATION.md and implementation   │
└────────────────────────────────────────────────────────┘
```

---

## 6. Risk Analysis & Mitigation Strategies

| Risk | Consequence | Mitigation Strategy |
|---|---|---|
| **Host Disk Space Exhaustion** | Backend cannot install `onnxruntime` or store checkpoint file. | **Hard Operational Gate:** Before executing Step 1, the user must clear at least 500 MB on Drive `C:`. Use ONNX Runtime INT8 (~85 MB) instead of standard PyTorch (~2.5 GB). |
| **False Positives on Filtered Photos** | Victim wrongly assumes a genuine compromising image is fake. | Enforce conservative decision threshold (0.75); display prominent educational disclaimer that social media beauty filters can trigger elevated artifact scores. |
| **False Negatives on Cutting-Edge DMs** | Victim believes a new synthetic deepfake is a genuine photograph. | Frame the lower range as "Low Indicators" rather than "Authentic". Explicitly state that generators evolve and absence of indicators is not proof of authenticity. |
| **Social Media Recompression Degradation** | Compression wipes out high-frequency forensic signals. | Pre-test model calibration on JPEG-compressed validation benchmarks (quality 70–85); route degraded samples into the *Inconclusive* tier. |
| **Silent Cloud Leakage** | Evidence transmitted to remote API. | Hard architectural rule: Pure local ONNX execution on localhost CPU. Network requests outside localhost strictly forbidden. |

---

## 7. Acceptance Criteria for Release Gate

The Core AI Forensics capability will be considered complete only when:
1. Model executes locally on Windows CPU without GPU or cloud network requests.
2. Inference latency is under 300 ms for a 1080p image.
3. Database correctly persists `model_name`, `model_version`, `result_score`, `score_type`, and `ai_forensics` metadata.
4. An uncalibrated percentage is never displayed as guaranteed truth.
5. Inconclusive scores are explicitly identified as inconclusive.
6. The frontend renders the new likelihood findings, uncertainty tiers, and educational notes cleanly.
7. Generated PDF reports include the model provenance, score, and mandatory disclaimers.
8. 100% of automated backend and frontend tests pass without regression.
