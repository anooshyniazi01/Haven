# Haven — AI Specification

## 1. Purpose

This document defines the AI and image-analysis functionality of Haven.

Haven helps users examine suspicious images, understand technical findings, and make informed decisions when dealing with possible image manipulation or digital blackmail.

The AI component must provide genuine, reproducible analysis. It must not manufacture predictions, claim unsupported capabilities, or present uncertain findings as established facts.

## 2. Core Design Principle

**Haven is an image-analysis and evidence-support tool, not an authenticity oracle.**

The application may identify patterns associated with a documented analysis method. It cannot independently establish who created an image, whether the depicted event occurred, whether a person consented, or whether blackmail allegations are true.

The interface must distinguish between:

- What the analysis method actually measured.
- What the measured output may suggest.
- What remains uncertain or cannot be determined.

## 3. Initial AI Scope

The first version focuses on static image files.

Potential capabilities include:

1. Image validation and metadata inspection.
2. Image properties and technical indicators.
3. Model-based image manipulation or synthetic-image analysis, if a suitable model is verified.
4. Human-readable explanations grounded in actual measurements and model outputs.
5. Preservation of the analyzed file and its hash when the user chooses to save it.

These capabilities are not automatically equivalent. Metadata inspection is not AI detection, and a model's prediction is not proof of manipulation.

Video analysis, audio analysis, facial identification, identity matching, and automatic identification of blackmailers are outside the initial scope.

## 4. Separate the Analysis Tasks

Haven must not combine different forensic questions into one ambiguous "AI detection score."

### Task A — Image Technical Inspection

Purpose: Inspect properties of the uploaded image.

Possible findings:
- Image dimensions.
- File format and decoded image properties.
- File size.
- Available metadata.
- Missing or incomplete metadata.
- Basic technical anomalies that can be measured and documented.

Rules:
- Use actual file inspection results.
- Clearly distinguish observed properties from inferred conclusions.
- Missing metadata is not evidence that an image is fake.
- Metadata may be edited, removed, or absent for legitimate reasons.

This task can use standard image-processing libraries and does not require a machine-learning model.

### Task B — Image Manipulation or Synthetic-Image Classification

Purpose: Investigate whether a suitable pretrained model can provide a meaningful classification for the supported image types.

Before implementation, evaluate whether a publicly available model:
- Has documented intended use.
- Supports the selected image formats and analysis task.
- Has accessible model weights and a usable license.
- Can run within the development environment's resource limits.
- Has relevant evaluation data and reported limitations.
- Can be used without sending private evidence to an undisclosed external service.

Do not assume that a general image classifier can detect manipulation or synthetic generation.

Do not assume that a model trained on one dataset will generalize to images from other sources, compression levels, editing tools, or generation systems.

If no suitable model can be verified, implement technical inspection first and clearly report that model-based classification is unavailable. Do not substitute random predictions, fabricated scores, or keyword-based guesses.

### Task C — Evidence Integrity

Purpose: Help users determine whether the bytes of a stored file still match the recorded file.

Use SHA-256 hashing to calculate a digest of the file bytes.

This is a deterministic integrity operation, not an AI prediction.

A matching hash supports byte-for-byte consistency between the compared files. It does not establish original authenticity, ownership, creation time, or chain of custody.

## 5. Model Selection Requirements

Do not select a model solely because it is popular, easy to download, or produces visually convincing demo results.

Before adopting a model, document:

- Model name and source.
- Intended use.
- Model architecture, if known.
- Training data and data limitations, where documented.
- License and usage restrictions.
- Required dependencies and model weights.
- Hardware and memory requirements.
- Expected inference latency.
- Supported input formats and preprocessing.
- Output meaning and numeric range.
- Published evaluation results and their limitations.
- Known failure modes and risks of domain shift.

Use a pretrained model when suitable. Training a new model from scratch is not required for the initial hackathon version.

The model must be loaded through a documented inference pipeline. If model weights cannot be downloaded or loaded, the application must report that limitation rather than silently switching to fake results.

## 6. Model Evaluation

Before using model predictions in the interface, define an evaluation protocol.

Where appropriate, evaluate:
- Precision.
- Recall.
- F1 score.
- Confusion matrix.
- False-positive and false-negative rates.
- ROC-AUC or precision-recall metrics when suitable for the task.
- Performance across relevant image sources and transformations.
- Inference time and resource consumption.

Use metrics appropriate to the selected task and dataset. Not every metric is meaningful for every model.

### Data separation

- Do not evaluate on training data and present the result as independent test performance.
- Avoid data leakage between training and test sets.
- Keep related or near-duplicate images in the same split where necessary.
- Document dataset provenance and permitted usage.
- Report class imbalance and dataset limitations.
- Do not claim broad real-world accuracy based on a small or unrepresentative sample.

Published benchmark results must be identified as published results, not Haven's own evaluation.

## 7. Score Interpretation

Every model score must have a documented meaning.

Examples of possible score types:
- Raw model logit.
- Similarity score.
- Anomaly score.
- Uncalibrated confidence score.
- Calibrated probability, when calibration has been established.

Requirements:
- Store the actual output produced by the selected method.
- Document the output range and interpretation.
- Define which direction indicates stronger support for each class.
- Do not convert arbitrary model outputs into percentages.
- Do not label a score as a probability without appropriate calibration evidence.
- Do not use an arbitrary threshold without documented justification.
- Preserve uncertainty when results are ambiguous.

If a model supports binary classification but has not been calibrated, display a carefully worded model result and explain that its score is not a verified probability.

If the output cannot be interpreted reliably, omit the score and explain why.

## 8. Explainability Requirements

Each completed analysis should provide the following where supported by the actual method:

1. **Finding:** The actual label or technical observation.
2. **Method:** The inspection procedure or model used.
3. **Interpretation:** What the finding may indicate.
4. **Limitations:** What the finding cannot establish.
5. **Technical details:** Relevant measurements and model version, when available.

Explanations must be grounded in recorded evidence and actual outputs.

Do not invent hidden model reasoning. Do not generate an explanation that claims a particular region was manipulated unless the method actually supports that conclusion.

If a model produces a localization map or other visual explanation, document what that visualization measures and its limitations before presenting it as forensic evidence.

## 9. AI Pipeline

The initial pipeline should follow this sequence:

1. Receive the uploaded image.
2. Validate its size, format, and content.
3. Store the original bytes safely.
4. Compute SHA-256 for the original uploaded bytes.
5. Inspect supported image properties.
6. Run the configured model only if it has been verified and is available.
7. Validate the returned model output.
8. Construct a report from actual observations and outputs.
9. Persist the result and relevant method metadata.
10. Return the persisted result to the frontend.

A failed stage must produce an appropriate error or an explicitly limited report. It must not produce a fabricated successful classification.

Any resized, recompressed, or otherwise transformed input must be treated as a derivative. Document preprocessing and preserve the original file separately.

## 10. Input Validation and Robustness

The backend must:
- Enforce file-size limits.
- Validate actual file content rather than trusting extensions.
- Reject unsupported or unreadable files.
- Handle malformed images without crashing the application.
- Apply documented preprocessing consistently.
- Prevent path traversal and unsafe storage operations.
- Avoid processing files indefinitely.
- Return safe error messages.
- Keep sensitive file contents out of logs.

Do not execute embedded scripts or active content from uploaded files.

## 11. Failure and Uncertainty States

The AI interface must support:

- `uploaded`: File accepted, analysis not completed.
- `processing`: Analysis is running.
- `completed`: A genuine analysis result has been persisted.
- `failed`: Analysis could not complete.

A technically successful inspection that does not support a reliable classification must not be represented as a confident authenticity verdict.

Where the model is unavailable, the interface should explain which functionality is unavailable and provide only the analysis that can genuinely be performed.

## 12. User-Facing Language

Prefer wording such as:
- "The selected model produced this classification."
- "The result is consistent with patterns learned by the model."
- "The available technical indicators are inconclusive."
- "No reliable conclusion can be drawn from this analysis."
- "This result does not independently establish authenticity."

Avoid unsupported claims such as:
- "This image is definitely fake."
- "This image is guaranteed authentic."
- "AI proves the person is lying."
- "This image is certainly manipulated."
- "The probability of fraud is 97%" when no calibrated probability exists.

A model's failure to flag an image does not prove that the image is genuine.

## 13. Privacy and External Services

The initial implementation should prefer local inference when a suitable model can run within the available environment.

Do not upload evidence to third-party APIs without an explicit architectural decision, documented data handling, and clear user disclosure.

Do not send sensitive images to an external model merely because it is easier to integrate.

Do not log image bytes, private image URLs, or unnecessary personal details.

Document any telemetry, external network requests, model downloads, or third-party dependencies that affect privacy.

## 14. Testing Requirements

Automated tests must verify:
- Valid and invalid image handling.
- Unsupported formats and oversized uploads.
- Correct SHA-256 calculation.
- Consistent preprocessing.
- Model output validation.
- Missing or unavailable model handling.
- Analysis failure behavior.
- Persistence and retrieval of actual results.
- Correct status transitions.
- Correct interpretation of missing scores.
- No fabricated result on inference failure.
- Safe error handling.
- Preservation of the original uploaded bytes.

Use small, controlled test fixtures for automated tests. Do not use real blackmail victims' images or other sensitive evidence as routine test fixtures.

## 15. Implementation Decisions Required Before Model Integration

Before implementing model-based classification, record the selected model and its evidence in `MODEL_EVALUATION.md`.

The decision must identify:
- The exact analysis task.
- Why the model is appropriate.
- The model's source and license.
- How it will run locally.
- Which evaluation dataset or evidence supports its use.
- Which metrics will be reported.
- Known limitations.
- The fallback behavior if it cannot run.

Do not proceed with model integration until these decisions are documented.

## 16. Final Acceptance Rule

Haven's AI functionality is acceptable only when its outputs are genuine, reproducible within the documented environment, appropriately interpreted, persisted correctly, and accompanied by relevant limitations.

A visually impressive interface is not evidence that the AI works. A working AI pipeline must be verified through actual inference, automated tests, and a complete frontend-to-backend workflow.

## 17. Implemented Model Specification (Vertical Slice 7)

As implemented in Vertical Slice 7, Haven integrates local full-image AI-generated image detection:

- **Model Identity**: `ai-image-detect-distilled-onnx` (v1.0.0)
- **Base Architecture**: Distilled Vision Transformer (`jacoballessio/ai-image-detect-distilled`), 11.8M parameters.
- **Weights & Runtime Format**: ONNX INT8 Quantized (`onnx-community/ai-image-detect-distilled-ONNX`), file size: 15.25 MB.
- **Verified License**: MIT License (permissive for local execution and redistribution).
- **Inference Engine**: `onnxruntime` 1.31.0 executing on pure local CPU (`CPUExecutionProvider`).
- **Physical Model Location**: `D:\haven_models\ai-image-detect-distilled\model_quantized.onnx` (preserving critical space on `C:`).
- **Preprocessing Pipeline**:
  - Minimum resolution verification: Images smaller than 64x64 pixels are rejected with an explicit forensic error (`unsupported_input`).
  - Color mode: Converted to 3-channel RGB.
  - Geometry: Resized to 224x224 pixels using PIL bicubic resampling (`Resampling.BICUBIC`).
  - Normalization: Tensor scaled to float32, normalized using `(pixel / 255.0 - 0.5) / 0.5` (mapping `[0, 1]` to `[-1, 1]`).
  - Tensor Shape: NCHW `[1, 3, 224, 224]` float32 array.
- **Inference Latency**: 50–80 ms per image on local CPU.
- **Output Post-Processing**: Softmax over 2-class logits (`[fake, real]`). The class 0 probability is extracted as `synthetic_likelihood`.
- **Honest Score Interpretation**:
  - The raw output score is reported transparently as an **uncalibrated raw model estimate (0.0 to 1.0)**.
  - Conservative forensic indicator bands:
    - `synthetic_likelihood >= 0.75`: `elevated_synthetic_indicators`
    - `0.25 <= synthetic_likelihood < 0.75`: `inconclusive_synthetic_signals`
    - `synthetic_likelihood < 0.25`: `low_synthetic_indicators`
- **Forensic Boundaries**:
  - Only full-image AI generation detection is performed. Pixel-level manipulation, splicing, inpainting, and face-swaps are outside this model's scope.
  - Zero external network requests or cloud telemetry during inference. Image bytes never leave the local machine.

