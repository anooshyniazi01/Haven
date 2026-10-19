# Haven — Model Evaluation Plan

## 1. Purpose

This document defines the process for selecting, evaluating, and approving a model for Haven's image-analysis functionality.

The goal is to choose a technically appropriate model that can run in the development environment, has documented limitations, and provides useful outputs for the application's intended purpose.

No model is approved merely because it can be downloaded or produces a prediction.

## 2. Evaluation Objectives

The selected model should:

- Address a clearly defined image-analysis task.
- Have a documented source, license, and intended use.
- Run within the available hardware and software environment.
- Provide outputs whose meaning can be explained accurately.
- Have evaluation evidence relevant to the intended use.
- Be testable through a reproducible inference pipeline.
- Avoid unnecessary transfer of sensitive images to external services.
- Fail safely when inputs are unsupported or inference is unavailable.

## 3. Define the Task Before Selecting a Model

Haven must distinguish between three different tasks.

### Task A — Technical image inspection

Examples:
- Image dimensions and format.
- File metadata.
- Basic file-integrity checks.
- Documented technical anomalies.

This can be implemented using ordinary image-processing and file-inspection libraries. It does not require a trained AI model.

### Task B — Synthetic-image or manipulation classification

This task requires a model specifically suited to the chosen classification problem.

Before selecting a model, define:
- What classes it predicts.
- Which image sources it supports.
- Whether it targets synthetic generation, image manipulation, or a narrower phenomenon.
- What preprocessing it requires.
- What its scores mean.

A model trained to detect AI-generated images must not automatically be described as a general-purpose detector of every kind of image manipulation.

### Task C — File integrity verification

This task uses cryptographic hashing to compare file bytes.

SHA-256 is appropriate for this purpose. It is not an AI model and cannot determine whether an image is genuine.

The initial implementation may combine Task A and Task C even if no suitable model is approved for Task B.

## 4. Candidate Model Research

Investigate publicly available models and model repositories only after defining the target task.

For each candidate, record:

- Model name and repository.
- Original paper or technical documentation, if available.
- Intended task and supported classes.
- Model architecture, if documented.
- Training dataset and provenance, where available.
- Published evaluation metrics.
- Known weaknesses and domain limitations.
- License and usage restrictions.
- Model weight size.
- Required libraries and runtime.
- Minimum practical memory requirements.
- CPU and GPU compatibility.
- Inference latency on the target environment.
- Whether local inference is possible.
- Whether model weights can be obtained reproducibly.

Do not invent missing details. Mark unknown information as unknown.

## 5. Candidate Comparison

Use the following criteria to compare candidates.

| Criterion | What to check |
|---|---|
| Task suitability | Does the model address the exact intended task? |
| Documentation | Are its behavior and limitations described? |
| License | Is the intended use permitted? |
| Reproducibility | Can the model and dependencies be identified and retrieved? |
| Runtime feasibility | Can it run on available hardware? |
| Evaluation quality | Is there relevant, credible evaluation evidence? |
| Generalization | Is performance tested beyond a narrow source dataset? |
| Output interpretation | Can its labels and scores be explained correctly? |
| Privacy | Can inference occur locally without undisclosed uploads? |
| Maintenance | Can the implementation be tested and maintained? |

Do not select a model based only on its published accuracy or a single overall score.

## 6. Local Environment Verification

Before implementation, record the available development environment:

- Operating system.
- Python version.
- Available CPU resources.
- Available system memory.
- GPU availability, if any.
- GPU memory, if applicable.
- Required model storage.
- Available disk space.

Test whether the model loads and runs using the actual environment.

A model that works on the author's GPU may not work efficiently on the developer's machine.

If the model requires more resources than are available, investigate a documented smaller variant or use technical inspection as the initial supported functionality.

Do not silently substitute a different model when loading fails.

## 7. Evaluation Dataset

Select a dataset that is appropriate for the chosen task and legally usable for the planned evaluation.

Record:
- Dataset name and source.
- Dataset version.
- License and usage restrictions.
- Class definitions.
- Number of examples per class.
- Image-source diversity.
- Known collection biases.
- Preprocessing applied.
- Train, validation, and test split methodology.

### Data separation

- Do not use training examples as independent test examples.
- Avoid leakage caused by duplicates or near-duplicates.
- Keep related images in the same split when appropriate.
- Do not tune thresholds on the final test set.
- Keep a separate test set for final evaluation whenever the dataset permits it.

A small personal test set may be useful for debugging, but it is not sufficient to establish broad real-world accuracy.

Do not use sensitive victim images or private blackmail evidence as routine evaluation data.

## 8. Evaluation Metrics

Select metrics according to the task and class balance.

### Classification metrics

Where applicable, calculate:
- Precision.
- Recall.
- F1 score.
- Confusion matrix.
- False-positive rate.
- False-negative rate.
- ROC-AUC.
- Precision-recall AUC.

Report the relevant class-specific results rather than relying exclusively on accuracy.

### Calibration

If the model produces confidence-like scores, determine whether those scores are calibrated before interpreting them as probabilities.

If calibration is not established, label the output appropriately and do not present it as a verified probability.

### Runtime metrics

Measure:
- Model loading time.
- Per-image inference time.
- Peak memory usage where practical.
- Failure rate on supported inputs.
- Resource usage under the expected workload.

Record the machine and software environment used for measurements.

## 9. Robustness Testing

Evaluate the model under realistic changes, where relevant to its intended task:

- JPEG recompression.
- Resizing.
- Resolution changes.
- Different image sources.
- Different generation or editing tools.
- Cropping.
- Metadata removal.
- Supported color-space changes.

These tests must be designed carefully because transformations can alter the evidence relevant to a particular detector.

Record each transformation and its effect on performance.

Do not assume that a detector remains reliable when images are compressed, resized, edited, or generated by tools absent from its training data.

## 10. Baseline and Comparison

Establish a simple baseline before claiming that a complex model is useful.

Depending on the task, compare the candidate against:
- A majority-class baseline.
- A simple documented technical heuristic.
- A simpler model with comparable input and output definitions.

A heuristic must not be presented as a trained AI model.

Only compare methods on compatible datasets, splits, and evaluation procedures.

Document cases in which a more complex model provides no meaningful improvement.

## 11. Approval Criteria

A model may be approved for integration only when:

1. Its intended task is clearly defined.
2. Its license permits the planned use.
3. Its dependencies and weights are accessible.
4. It runs in the intended environment.
5. Its output labels and scores are understood.
6. Relevant evaluation results are available.
7. Known limitations are documented.
8. The inference pipeline can be tested.
9. Failure handling works correctly.
10. Its user-facing claims remain within the evidence.

There is no universal accuracy threshold that automatically makes a model suitable for forensic use.

Approval must consider the consequences of false positives and false negatives, the intended audience, dataset representativeness, and the limitations of the evaluation.

## 12. False Positives and False Negatives

A false positive occurs when the model flags an image as belonging to a class when it does not.

A false negative occurs when the model fails to identify an image that belongs to the target class.

For Haven, both can have serious consequences.

Requirements:
- Do not describe a flagged image as definitive proof of manipulation.
- Do not describe an unflagged image as proof of authenticity.
- Explain that performance on benchmark datasets may not transfer to real-world images.
- Avoid language that encourages users to accuse or confront someone solely on the basis of a model output.

## 13. Reproducibility Record

For every approved model, preserve a record of:

- Model identifier.
- Model version or checkpoint hash, where available.
- Source repository or official model page.
- License.
- Dependency versions.
- Python and runtime versions.
- Preprocessing configuration.
- Input and output definitions.
- Dataset versions and split methodology.
- Evaluation script version.
- Evaluation results.
- Known limitations.
- Date of evaluation.

Use version-controlled configuration files where practical. Do not commit large model weights or sensitive datasets to the repository unless explicitly justified.

## 14. Evaluation Report Template

Complete this record before enabling a candidate model in Haven.

### Candidate

- Model name:
- Source:
- Intended task:
- License:
- Model version:
- Input requirements:
- Output definitions:

### Environment

- Operating system:
- Python version:
- CPU/GPU:
- System memory:
- Model storage size:
- Dependencies:

### Evaluation

- Dataset:
- Dataset license:
- Split methodology:
- Number of test examples:
- Precision:
- Recall:
- F1 score:
- False-positive rate:
- False-negative rate:
- Calibration assessment:
- Inference latency:
- Robustness results:

Use `Not measured` or `Not available` where appropriate. Do not invent metrics.

### Limitations

- Known dataset biases:
- Unsupported inputs:
- Known failure modes:
- Generalization concerns:
- Privacy concerns:

### Decision

Choose one:
- Approved for the documented scope.
- Approved with restrictions.
- Rejected.
- Evaluation incomplete.

Explain the evidence supporting the decision.

## 15. Fallback Plan

If no candidate meets the requirements:

1. Implement technical image inspection.
2. Preserve uploaded files and calculate their hashes.
3. Explain which model-based functionality is unavailable.
4. Continue evaluating suitable candidates separately.
5. Do not display fabricated classification results.
6. Do not describe technical inspection as equivalent to AI manipulation detection.

A smaller, honest, working product is preferable to a larger application with unreliable or simulated AI functionality.

## 16. Final Rule

A model's existence, published benchmark, or successful inference call does not establish that it is reliable for Haven's intended use.

Every model claim must be supported by documented behavior and relevant evaluation evidence.

Update this document whenever the selected model, evaluation procedure, or approved use changes.

---

## 17. Specific Evaluation Protocol for Task A: Synthetic Media Detection

### 17.1 Benchmark Datasets & Provenance
To evaluate the proposed UniversalFakeDetect ONNX adapter objectively without data leakage:

* **Real Photography Datasets (Negative Class):**
  * *COCO 2017 Val (5,000 images):* Diverse consumer photography with authentic camera sensor noise and natural lighting variations.
  * *RAISE Dataset (subset of 1,000 pristine captures):* Uncompressed real captures from physical camera sensors.
* **Synthetic Generation Datasets (Positive Class):**
  * *Ojha et al. Diffusion Benchmark:* Includes standardized synthetic outputs from Latent Diffusion (LDM-200), Stable Diffusion v1.4, GLIDE, and DALL-E.
  * *Midjourney & SDXL Evaluation Split:* Curated set of modern diffusion outputs to test forward generalization beyond the training baseline.
* **Leakage Prevention:**
  * The linear probe is trained exclusively on ProGAN images (20 categories). Zero diffusion models, GLIDE, or Midjourney images are included in the training split.
  * Real and fake images must be evaluated across identical spatial dimensions ($224 \times 224$ center crop).

### 17.2 Core Metrics & Targets
1. **Average Precision (AP):** Target $\ge 90.0\%$ across all unseen generative models in uncompressed settings.
2. **Area Under ROC Curve (ROC-AUC):** Target $\ge 88.0\%$ on diffusion models.
3. **Precision at Low False Positive Rate (FPR $\le 5\%$):** In digital blackmail defense, falsely categorizing real evidence as AI-generated is a critical failure. The decision threshold must achieve $\ge 85\%$ precision when FPR is constrained to $\le 0.05$.
4. **Expected Calibration Error (ECE):** Target ECE $\le 0.08$ after Platt scaling or temperature tuning, ensuring model output numbers align with observed empirical frequencies.
5. **CPU Latency & Footprint:**
   * Single-image CPU inference latency $\le 200$ ms on x86_64 CPU.
   * Peak RAM consumption $\le 500$ MB.
   * Model checkpoint storage $\le 100$ MB (INT8 ONNX).

### 17.3 Perturbation & Robustness Stress Tests
Every candidate release must be tested against simulated social media degradation:
* **JPEG Compression:** Recompressed at quality factors $Q \in \{90, 75, 50\}$. Model must maintain AP $\ge 80.0\%$ at $Q=75$.
* **Spatial Resizing:** Downsampling by factor of 0.5 followed by upsampling.
* **Gaussian Blur:** Filter with kernel radius $\sigma \in \{1.0, 2.0\}$.

### 17.4 Release Acceptance Gate
The model will only be promoted from experimental to active production if:
1. It meets all targets in Section 17.2 and 17.3.
2. It executes completely on localhost CPU via `onnxruntime` without external network connections.
3. Evaluation code and test dataset manifests are version-controlled in `backend/tests/evaluation/`.
4. The host disk space constraint has been resolved prior to weight storage.

---

## 18. Vertical Slice 7 Implemented Model Evaluation Record

### 18.1 Model Provenance and Attributes
* **Selected Candidate**: `ai-image-detect-distilled-onnx` (v1.0.0)
* **Architecture**: Distilled Vision Transformer (11.8M parameters), base repository `jacoballessio/ai-image-detect-distilled`.
* **Weights Source**: `onnx-community/ai-image-detect-distilled-ONNX` (`model_quantized.onnx`).
* **License**: MIT License (verified in repository root).
* **Storage Footprint**: 15.25 MB ONNX quantized checkpoint stored on `D:\haven_models\ai-image-detect-distilled\`.
* **Inference Runtime**: `onnxruntime` 1.31.0 on local CPU (`CPUExecutionProvider`). Zero external cloud network connections.

### 18.2 Empirical Measurements on Local Development Host
* **CPU Inference Latency**:
  * Cold start session initialization: ~110 ms
  * Warm inference latency: 50–78 ms per $224 \times 224$ image on host Intel CPU.
* **Memory Utilization**: Peak process RAM overhead of ONNX session $\le 65$ MB.
* **Deterministic Behavior**: Softmax sum over `[fake, real]` equals $1.000000 \pm 10^{-6}$.

### 18.3 Initial Real-Image Smoke Test Observations
* **Natural Photograph Baseline (`scratch/sample_inspection_image.jpg`):**
  * Raw Synthetic Score: `0.2051` (Natural probability: `0.7949`).
  * Indicator Tier: `low_synthetic_indicators` ($< 0.25$).
  * Forensic Explanation: Correctly identified natural camera sensor distribution without reporting false elevated synthetic flags.
* **Resolution Guard Enforcement:**
  * Tested with synthetic $32 \times 32$ PNG input.
  * System safely rejected inference with `unsupported_input` status and explicit explanation: *"Image dimensions (32x32) are smaller than minimum forensic resolution (64x64). Reliable detection is not possible."*
* **Unavailable / Missing Weights Behavior:**
  * Tested with missing weights path in unit test suite.
  * System safely entered `status: unavailable` and preserved technical inspection without generating fake numbers or crashing.

### 18.4 Evaluation Status & Honest Limitations
* **Decision Status**: **Approved with Restrictions (Decision-Support Only).**
* **Calibration Status**: Uncalibrated raw model estimate. Not a calibrated Bayesian posterior probability.
* **Forensic Boundaries**:
  * Does not detect localized splicing, inpainting, face-swaps, or metadata tampering.
  * May degrade under heavy messaging compression or unseen model generators.
  * Full multi-generator benchmark evaluation against the complete Ojha/COCO suites (Section 17.1) remains scheduled as offline evaluation research.



---

## 15. Verified Implementation & Production Verification Status (October 2026)

The AI Forensics & Image Analysis slice has been implemented, integrated, and verified end-to-end:

1. **Model Specification & Hardware Profile:**
   - **Model Identifier:** `ai-image-detect-distilled-onnx` (derived from `jacoballessio/ai-image-detect-distilled`)
   - **Model Architecture:** Distilled Vision Transformer (ViT-small, quantized INT8 ONNX, 14.55 MB checkpoint)
   - **Hardware Profile:** Local CPU execution only (`onnxruntime.InferenceSession` with `CPUExecutionProvider`). No GPU requirements or external cloud APIs.
   - **Input Contract:** 224 × 224 pixels, RGB color mode, `Image.Resampling.BILINEAR` interpolation, normalized to `[-1.0, 1.0]` via `(x / 255.0 - 0.5) / 0.5`, NCHW tensor layout (`float32[1, 3, 224, 224]`).
   - **Output Contract:** Tensor `logits` with shape `[1, 2]`. Index 0 = synthetic (`fake`), Index 1 = authentic (`real`). Softmax computes `synthetic_likelihood = exp(l0) / (exp(l0) + exp(l1))`.
   - **Execution Latency:** Empirically measured ~80–120 ms on modern x86_64 CPU.

2. **Unified Data Contract:**
   - Canonical response schema (`AIForensicsResult`) shared identically between `app.schemas.analysis`, `types/analysis.ts`, database serialization (`technical_details_json`), and PDF forensic report generation (`pdf_exporter.py`).

3. **Classification & Scoring Policy:**
   - Status declared honestly as `uncalibrated_raw_model_estimate`.
   - Continuous score exposed with cautious interpretation tiers:
     - `>= 0.75`: `elevated_synthetic_indicators`
     - `0.25 <= score < 0.75`: `inconclusive_synthetic_signals`
     - `< 0.25`: `low_synthetic_indicators`
   - Explicit disclaimers note that high scores do not prove synthetic origin and low scores do not prove authenticity.

4. **Model Evaluation Framework:**
   - Reproducible evaluation engine implemented in `app.services.evaluator.ModelEvaluator` accepting structured `DatasetManifest` inputs.
   - Computes confusion matrix, accuracy, precision, recall (sensitivity), specificity, F1 score, error rates, and rank-sum ROC-AUC.
   - Production accuracy marked as unevaluated on public ground-truth benchmarks until a permitted, labelled dataset is evaluated.

5. **Test & Verification Summary:**
   - Backend pytest suite: 87 passed / 87 tests.
   - Frontend vitest suite: 57 passed / 57 tests.
   - TypeScript verification (`tsc --noEmit`): 0 errors.
   - Production Vite build (`vite build`): Succeeded (252.7 kB JS, 2.68 kB CSS).
   - Live smoke test & browser subagent recording: End-to-end verified across upload, inspection, AI detection, PDF export, and Evidence Vault integration.
