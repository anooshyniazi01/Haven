# Haven AI Forensics Skill

## 1. Purpose

Develop Haven's image-analysis capabilities using real, technically defensible methods.

The objective is to help users examine suspicious digital images, understand observable signals and analytical limitations, and make informed decisions about next steps.

Haven is an AI-assisted analysis and documentation tool. It must not claim that its model can conclusively establish authenticity, identify a blackmailer, prove malicious intent, or determine the complete history of an image.

Follow:

- `AGENTS.md`
- `docs/AI_SPEC.md`
- `docs/MODEL_EVALUATION.md`
- `docs/API_SPEC.md`
- `docs/SECURITY.md`
- `docs/PRIVACY.md`
- `docs/EVIDENCE_HANDLING.md`
- `docs/TEST_PLAN.md`

## 2. Required Workflow

Before implementing or modifying analysis functionality:

1. Read the root `AGENTS.md`.
2. Identify the current task in `docs/IMPLEMENTATION_PLAN.md`.
3. Read `docs/AI_SPEC.md` and `docs/MODEL_EVALUATION.md`.
4. Inspect the existing analysis implementation and dependency versions.
5. Identify the actual method or model available for the task.
6. Check licensing, input requirements, computational requirements, and limitations.
7. Implement the smallest complete analysis capability within the current vertical slice.
8. Test it with appropriate known examples and failure cases.

Do not select a model based only on a promising name, a high reported benchmark, or a claim made in a repository README.

## 3. Distinguish Analysis Methods

Haven may use different methods, but their results must remain clearly distinguished.

### A. Technical image inspection

Depending on the implemented method, this may include:

- File-format identification and decoding.
- Image dimensions and color properties.
- Available metadata.
- Encoding and compression characteristics.
- Embedded-profile or structural information.
- Cryptographic hashing.
- Other documented and reproducible image properties.

Report only properties that the implementation actually inspected.

Missing metadata does not prove manipulation. Present metadata may be incomplete, modified, or misleading. A technically valid file is not necessarily authentic.

### B. AI-assisted image analysis

A model may estimate patterns associated with a particular trained task, such as synthetic-image detection or image-manipulation classification.

Before integrating a model, establish:

- The exact task it was trained to perform.
- The model's identity and version.
- Its training-data characteristics, where known.
- Its expected input format and preprocessing.
- Its output structure and score semantics.
- Its documented limitations.
- Its license and deployment requirements.
- Whether its inference can run within Haven's available environment.

Do not assume that a synthetic-image detector can reliably detect every edited photograph, face swap, inpainting operation, or other manipulation.

### C. Interpretation and guidance

Explanations and safety recommendations must not be presented as direct model observations unless the system actually produces and supports them.

Keep technical findings, model outputs, interpretations, and practical guidance distinguishable in both API responses and the user interface.

## 4. Real Inference Only

- Use an actual, documented implementation for AI-assisted predictions.
- Load the selected model or inference pipeline correctly.
- Apply the required preprocessing consistently.
- Use the correct inference mode and tensor/device handling for the selected framework.
- Handle model initialization and inference failures explicitly.
- Validate outputs before returning them.
- Record relevant model and method identifiers where available.
- Test the real inference path with representative inputs.

Never fabricate model scores, labels, explanations, or confidence values.

Do not substitute random numbers, keyword rules, filename checks, hardcoded responses, or artificial progress updates for AI inference.

If a suitable model cannot be integrated reliably, implement the approved technical-inspection methods and clearly indicate that AI-assisted classification is unavailable. Document what remains necessary to enable it.

Do not claim that the AI feature is operational merely because its API route or user-interface screen exists.

## 5. Scores, Confidence, and Uncertainty

Use the model's actual output semantics.

- Do not automatically interpret a raw score as a probability.
- Do not call a value a calibrated confidence unless calibration has been established.
- Do not invent probability percentages to make the interface easier to understand.
- Do not create a universal threshold without evaluation on appropriate data.
- Do not treat a score close to a threshold as a definitive conclusion.
- Document the meaning and limitations of any classification categories.
- Make uncertainty and out-of-scope cases visible.

If the model returns a score for synthetic-image likelihood, explain that it is an estimate associated with that model and task, not proof that the image was generated by AI.

If the output is unsuitable for interpretation, the system should return an explicit indeterminate or analysis-unavailable outcome rather than a fabricated conclusion.

## 6. Model Selection and Evaluation

Follow `docs/MODEL_EVALUATION.md`.

Evaluate models using a documented, reproducible process that considers:

- Relevance to the intended task.
- Quality and provenance of evaluation data.
- Licensing and permitted use.
- Inference cost and hardware requirements.
- Accuracy and relevant error types.
- Robustness to resizing, recompression, screenshots, and other realistic transformations.
- Performance on inputs that differ from the training distribution.
- Reproducibility and version stability.
- Privacy implications of the chosen deployment method.

Prefer appropriate public benchmarks and independent evaluation where available, but do not assume benchmark performance transfers directly to Haven's users or images.

Record the evaluation dataset, sample selection, preprocessing, thresholds, metrics, and known limitations.

Do not tune and evaluate a model on the same examples in a way that produces misleading performance estimates.

## 7. Metrics and Error Analysis

Select metrics according to the task and class distribution.

Where appropriate, consider:

- Precision.
- Recall.
- F1 score.
- Confusion matrix.
- False-positive rate.
- False-negative rate.
- ROC-AUC or precision-recall AUC when suitable.
- Calibration metrics when probability interpretation is intended.
- Performance across relevant image categories and transformations.

Explain which errors matter most for the intended use.

A false positive may cause a user to distrust a genuine image. A false negative may create false reassurance about a manipulated or synthetic image.

Do not report a single accuracy figure without explaining the evaluation context and its limitations.

Do not claim a model is reliable for blackmail-related evidence merely because it performs well on an unrelated benchmark.

## 8. Dataset and Test Integrity

- Use legitimate datasets with documented sources and applicable usage permissions.
- Keep training, validation, and test sets appropriately separated.
- Prevent data leakage, including duplicate or near-duplicate images across splits where relevant.
- Track preprocessing and dataset versions.
- Avoid collecting unnecessary personal or sensitive images.
- Never upload private evidence to a public dataset or external evaluation service without explicit authorization and an approved privacy process.
- Use synthetic or otherwise appropriate test fixtures where possible.
- Keep a record of the actual examples and test conditions used.

Do not invent evaluation results or imply that a model was benchmarked when it was not.

## 9. Image Preprocessing and Resource Limits

- Validate decoded image dimensions and total pixel count.
- Handle malformed, truncated, or unsupported image files.
- Apply documented resizing, normalization, color conversion, and channel ordering.
- Preserve consistency between evaluation preprocessing and production inference.
- Avoid uncontrolled decompression or allocations from unusually large images.
- Handle corrupt inputs without crashing the API process.
- Avoid silently transforming images in ways that materially change the analysis without documenting the behavior.
- Do not overwrite the user's original evidence during preprocessing.

If the analysis uses a derived image, keep the distinction between the original and the derived input clear.

## 10. Explainability

Only provide explanations supported by the implemented method.

- If a model supplies a documented explanation mechanism, describe its output and limitations.
- If a visualization highlights image regions, explain that highlighted regions are model-related signals, not proof that those regions were manipulated.
- Do not generate a persuasive natural-language explanation and present it as though it were derived from the model when it was not.
- Do not use an unrelated language model to invent forensic findings.
- Distinguish observed file properties from inferred patterns.

If meaningful explainability is unavailable, say so clearly rather than fabricating it.

## 11. Provenance and Cryptographic Integrity

Use hashing where specified by `docs/EVIDENCE_HANDLING.md`.

- Hash the actual bytes of the relevant file.
- Record the algorithm used.
- Use deterministic, tested implementations.
- Recompute hashes when an integrity comparison is required.
- Avoid confusing an analysis result with a verified evidence history.

A SHA-256 match means the compared bytes match the recorded digest. It does not establish who created the image, whether the image depicts a real event, whether it was manipulated before hashing, or when it was created.

Metadata, hashes, model outputs, and visual inspection each answer different questions. Do not combine them into an unsupported claim of authenticity.

## 12. API Integration

Follow `docs/API_SPEC.md`.

Return only fields supported by the actual implementation, using the documented response schema.

Where applicable, distinguish:

- Technical inspection results.
- AI method or model identification.
- Actual model outputs and their documented semantics.
- Analysis status.
- Relevant limitations.
- Safe, actionable next steps.

Handle unavailable models, unsupported input, decoding errors, timeouts, and inference failures explicitly.

Do not return a successful analysis response when inference failed or only part of the requested analysis was completed. If partial results are supported by the contract, identify which components succeeded and which did not.

Never include internal paths, stack traces, secrets, or sensitive evidence content in API responses.

## 13. Privacy and Safety

- Process evidence locally within the approved deployment whenever the architecture permits.
- Do not transmit user images to third-party model providers unless the approved design explicitly allows it and the user receives appropriate disclosure.
- Do not retain images longer than the documented retention policy permits.
- Avoid storing unnecessary copies of original images.
- Never log sensitive image content.
- Do not use user-submitted evidence for training without an explicit, approved consent and governance process.
- Do not present model findings as legal conclusions or proof of criminal conduct.
- Do not tell users that a model result guarantees safety or establishes that an image is genuine.

Where blackmail or intimate-image abuse is involved, provide nonjudgmental, practical guidance consistent with the approved safety guidance and evidence-handling specifications.

## 14. Testing

Use the test framework and requirements defined in `docs/TEST_PLAN.md`.

Test:

- Known supported image formats.
- Unsupported and malformed files.
- Images at configured size and dimension limits.
- Empty, unexpected, or invalid model outputs.
- Model initialization failures.
- Inference exceptions and timeouts.
- Correct preprocessing and output interpretation.
- Stable behavior on repeated identical inputs where expected.
- Real inference against suitable test fixtures.
- API serialization and error responses.
- Resource cleanup after failed analysis.
- Regression cases associated with known model limitations.

Keep unit tests, integration tests, and evaluation benchmarks distinct. A mocked unit test does not establish that the real model works correctly.

Run available tests and record actual outcomes. If the model requires unavailable hardware or dependencies, state that limitation explicitly.

## 15. Definition of Done

An AI-forensics task is complete only when:

- The selected method is documented and appropriate to the task.
- Any claimed inference is performed by a real implementation.
- Preprocessing and output interpretation are correct.
- Unsupported inputs and analysis failures are handled.
- Relevant uncertainty and limitations are communicated.
- Privacy and resource requirements are respected.
- Relevant tests have actually been run.
- API responses match the documented contract.
- Evaluation claims are supported by recorded evidence.
- Remaining limitations and unavailable capabilities are clearly reported.

Haven should help users understand what the available evidence and analytical methods can tell them—and what they cannot establish.