# Haven — Implementation Plan

## 1. Purpose

This document defines the implementation order for Haven, from an empty repository to a tested application.

The goal is to build a functioning, integrated product—not a collection of attractive but disconnected screens.

Follow this plan sequentially. Complete and verify each phase before proceeding to the next, unless a documented dependency requires a justified adjustment.

## 2. Non-Negotiable Implementation Rules

1. Read `AGENTS.md` and the relevant specifications before writing code.
2. Inspect the existing repository before creating, replacing, or deleting files.
3. Build features using vertical slices.
4. Connect the UI, API, backend logic, and database or model wherever the feature requires them.
5. Do not substitute mock data for actual application functionality.
6. Never invent AI predictions, confidence scores, progress percentages, evidence records, or successful operations.
7. Test each slice before starting the next.
8. Fix failures instead of building additional features on top of broken functionality.
9. Keep documentation synchronized with actual implementation.
10. Do not claim a feature or test is complete without verifying it.
11. Preserve existing working code unless a change is justified.
12. Prefer the simplest architecture that satisfies the documented requirements.

## 3. Phase 0 — Repository Inspection and Planning

### Tasks

- Inspect the repository and its current files.
- Read `AGENTS.md` and all relevant documents in `docs/`.
- Identify which files, if any, already contain working code.
- Check available development tools and dependency managers.
- Identify contradictions, missing prerequisites, and implementation blockers.
- Confirm the selected Python and Node.js versions.
- Establish a clear repository structure.
- Create or verify `.gitignore` before generating runtime files.

### Acceptance criteria

- The implementation approach is consistent with the documented architecture.
- Existing work has not been overwritten without justification.
- Required dependencies and runtime versions are identified.
- Sensitive files and generated data are excluded from version control.
- No application feature has been falsely marked complete.

Do not begin building the entire frontend during this phase.

## 4. Phase 1 — Project Foundation

### Backend

- Initialize the FastAPI application.
- Add validated configuration.
- Add controlled exception handling.
- Configure structured API responses.
- Configure SQLAlchemy and Alembic.
- Establish a health endpoint.
- Add initial backend tests.

### Frontend

- Initialize React, TypeScript, and Vite.
- Configure routing if needed.
- Set up the centralized design tokens.
- Establish the application shell.
- Add a minimal API client.
- Configure frontend testing.

### Integration

- Start the frontend and backend independently.
- Verify that the frontend can communicate with the backend.
- Verify the health endpoint.
- Run the initial test suites.

### Acceptance criteria

- Both applications start using documented commands.
- The health endpoint returns the expected response.
- The frontend can display actual backend availability.
- Configuration errors are handled clearly.
- No mock health response is presented as a real backend response.
- Initial automated tests pass.

## 5. Phase 2 — Application Shell and Overview

### Tasks

- Implement the primary navigation defined in `UI_UX_SPEC.md`.
- Apply the design system consistently.
- Build the responsive application shell.
- Create the Overview page.
- Add a real backend endpoint for the summary data the page needs.
- Define and test empty-state behavior.
- Add loading, error, and unavailable states.

### Acceptance criteria

- Navigation opens the intended pages or clearly identifies unfinished routes.
- The Overview page requests real backend data.
- Empty states appear when no records exist.
- Failed requests produce honest error states.
- No fabricated counts, charts, or sample evidence are displayed as real user data.
- The interface works at desktop and mobile widths.
- Keyboard navigation and visible focus states work.

## 6. Phase 3 — Image Upload

### Tasks

- Define the upload API and response schema.
- Implement the file-selection interface.
- Enforce backend file size and format restrictions.
- Validate file content rather than trusting filename extensions or client-supplied MIME types.
- Generate safe internal filenames.
- Store accepted files outside publicly served directories.
- Calculate the SHA-256 digest of the stored file bytes.
- Create the necessary database records.
- Handle invalid files, interrupted uploads, storage failures, and duplicate submissions.
- Add tests for both valid and invalid cases.

### Acceptance criteria

- A supported image can be uploaded successfully.
- The backend—not only the frontend—enforces restrictions.
- The stored file is not publicly accessible.
- The digest can be independently recomputed and verified.
- Invalid uploads produce understandable errors.
- Failed uploads do not leave misleading successful records.
- Sensitive data is not written to application logs.
- The UI reflects the real backend response.

Do not begin AI inference until the upload slice works end to end.

## 7. Phase 4 — Image Analysis

### Tasks

- Review `AI_SPEC.md` and `MODEL_EVALUATION.md`.
- Identify a suitable analysis method and verify its license, availability, resource requirements, and limitations.
- Implement supported technical image inspection.
- Integrate actual model inference only when an appropriate method has been selected and evaluated.
- Separate technical measurements from model predictions.
- Persist analysis results and relevant method/version metadata.
- Handle unavailable models, unsupported files, inference failures, and timeouts.
- Test the analysis endpoint against representative cases.

### Acceptance criteria

- Every displayed result comes from an executed method.
- Technical inspection and AI findings are distinguishable.
- Model outputs include appropriate limitations.
- Unsupported or inconclusive cases are handled honestly.
- No fabricated confidence scores or authenticity claims appear.
- Inference failures do not become successful-looking reports.
- Tests verify both successful and unsuccessful analysis paths.

If no suitable model is available, finish and verify the implemented technical inspection capability. Clearly label AI analysis as unavailable rather than pretending the model exists.

### Status
- **Technical Inspection Implemented & Verified (Slice 3)**: Deterministic Pillow-based geometry, color channels, bit depth, EXIF metadata extraction, GPS privacy redaction, and structural marker checks (EOF/IEND).
- **Core AI Forensics Model: Research & Planning Completed**: Evaluated Tasks A, B, and C in `docs/AI_FEASIBILITY_RESEARCH.md` and detailed the implementation blueprint in `docs/CORE_AI_FORENSICS_PLAN.md`. Selected Task A (Synthetic Media Detection) using an ONNX-quantized UniversalFakeDetect architecture for local CPU execution. Model integration is scheduled pending resolution of host disk space prerequisites; model has NOT yet been downloaded or executed in production.

## 8. Phase 5 — Analysis Results and Saved Reports

### Tasks

- Build the results page using the actual analysis response.
- Display relevant technical details and findings.
- Explain unfamiliar terms and limitations.
- Implement a backend endpoint to retrieve saved reports.
- Connect the report page to persistent database records.
- Support loading, empty, missing-record, and server-error states.
- Verify that the displayed report matches the stored result.

### Acceptance criteria

- A completed analysis can be viewed after the original request ends.
- Refreshing the page does not invent or lose a persisted report.
- Missing records return a clear not-found state.
- The UI distinguishes measured facts from predictions.
- The report does not claim to prove authenticity or provenance.
- Results remain consistent with the backend record.

## 9. Phase 6 — Evidence Vault

### Tasks

- Implement a backend endpoint to list authorized evidence records.
- Connect the Vault page to persistent storage.
- Display relevant metadata and hash information.
- Implement evidence details and integrity verification where specified.
- Implement deletion only according to the documented retention and deletion rules.
- Handle missing files, mismatched hashes, and database/storage inconsistencies.
- Add tests for access control and failure scenarios.

### Acceptance criteria

- Records originate from the actual database.
- File access is mediated by the backend.
- Integrity verification compares the file bytes against the recorded digest.
- A hash match is not presented as proof of authenticity.
- Missing or altered files are reported honestly.
- Deletion behavior matches the documented policy.
### Status
- **Implemented & Verified (Slice 4)**: Persisted evidence listing with pagination, search, and report filter; detail view with storage existence verification; on-demand cryptographic SHA-256 integrity verification against stored file bytes; seamless navigation to technical inspection report and evidence intake; complete unit, integration, and E2E automated test suites passing. Retention/deletion policies remain omitted until formally specified.

## 10. Phase 7 — Incident Tracker

### Tasks

- Define the incident data model and validation rules.
- Implement create, read, update, and delete operations where required.
- Connect the interface to actual backend endpoints.
- Handle optional descriptions and user-entered notes safely.
- Apply appropriate authorization if accounts or multiple users are supported.
- Avoid logging sensitive incident descriptions.
- Test validation, persistence, and error handling.

### Acceptance criteria

- Incident records persist in the database.
- Changes remain consistent after refreshing the application.
- Invalid input is handled predictably.
- Private descriptions are not unnecessarily exposed.
- No invented incidents appear in the interface.
- Destructive actions follow the documented confirmation behavior.

### Status
- **Implemented & Verified (Slice 5)**: Real SQLite persistence for incidents and atomic evidence linking; list view with search, status filtering, and pagination; incident detail view with an honest, transparent Case Milestones timeline; full edit workflow; user-confirmed incident deletion with strict safety guarantees (evidence database rows and raw disk files survive deletion); comprehensive unit, integration, and live browser verification; zero data leaks.

## 11. Phase 8 — Report Export

### Tasks

- Confirm the supported export format and required content.
- Generate exports from persisted report data.
- Include relevant technical findings, timestamps when genuinely recorded, method/version details, and limitations.
- Prevent arbitrary filesystem paths or untrusted filenames from controlling export operations.
- Ensure exported content does not include unnecessary sensitive information.
- Test generated reports and failure scenarios.

### Acceptance criteria

- Exported reports match the stored data.
- Export works only when the required record exists.
- Missing or failed analysis data is not fabricated.
- Limitations remain visible in the exported document.
- File generation does not expose unrelated server files.
- The download response is handled correctly by the frontend.

### Status
- **Implemented & Verified (Slice 6)**: Pure Python ReportLab PDF exporter (`backend/app/services/pdf_exporter.py`) with zero-disk in-memory streaming via `io.BytesIO`; authenticated `GET /api/v1/analyses/{analysis_id}/export` returning genuine `application/pdf` with safe attachment headers; honest forensic disclosures including prominent SHA-256 byte digest disclaimer and AI capability disclaimer; automated privacy exclusions (raw GPS withheld, internal paths suppressed); complete frontend integration in Image Analyzer and Evidence Vault with safe blob download and duplicate submission prevention; 75 backend tests passing, 55 frontend tests passing, TypeScript clean, production build passing, and live browser verification verified.

## 12. Phase 9 — Safety Guide

### Tasks

- Implement the safety content defined by the product requirements.
- Organize guidance into clear, readable sections.
- Include practical evidence-preservation and account-safety guidance.
- Explain that users should avoid making risky decisions based solely on automated analysis.
- Avoid blaming or shaming language.
- Provide appropriate guidance for immediate danger and relevant local support options only when those resources have been verified.
- Ensure the guide remains accessible without completing an analysis.

### Acceptance criteria

- Guidance is readable on desktop and mobile.
- Important safety information is easy to find.
- Content does not overpromise what Haven can accomplish.
- Users are not told to confront a suspected blackmailer or take another action that could increase risk without considering safety.
- The page does not require fake user data or AI inference to function.

## 13. Phase 10 — Settings and Remaining Navigation

### Tasks

- Implement only settings that have a defined purpose and actual behavior.
- Verify all navigation destinations.
- Remove dead buttons and placeholder controls.
- Ensure settings accurately describe the application's real configuration.
- Do not introduce a theme toggle or preference control that does not work.

### Acceptance criteria

- Every visible control has an implemented action or is clearly presented as unavailable.
- Settings persist when persistence is promised.
- No settings screen exposes secrets or sensitive server configuration.
- Navigation and error states remain consistent.

## 14. Phase 11 — Security and Privacy Verification

Review the complete implementation against:

- `SECURITY.md`
- `PRIVACY.md`
- `THREAT_MODEL.md`
- `EVIDENCE_HANDLING.md`
- `ERROR_HANDLING.md`

### Tasks

- Review upload validation and resource limits.
- Verify private storage and access controls.
- Check database and file-storage consistency.
- Review error responses and application logs.
- Verify CORS and network configuration.
- Check dependency vulnerabilities using appropriate available tooling.
- Confirm secrets and generated sensitive files are excluded from Git.
- Review data retention, deletion, and backup behavior.
- Verify that external data transfers match the documented design.

### Acceptance criteria

- No known critical security issue remains unaddressed in the implemented core workflows.
- Sensitive files are not served publicly.
- Error messages do not reveal stack traces or secrets.
- Access controls are verified wherever access-controlled functionality exists.
- Remaining limitations are documented.
- Passing tests are supported by actual test results.

## 15. Phase 12 — Integration, Accessibility, and Responsive Testing

### Tasks

- Run all backend tests.
- Run all frontend tests.
- Run end-to-end tests for core workflows.
- Test keyboard navigation and focus management.
- Run automated accessibility checks.
- Manually inspect relevant accessibility behavior.
- Test the specified viewport widths.
- Verify empty, loading, success, error, and unavailable states.
- Test interrupted uploads and unavailable inference.
- Verify the documented setup from a clean environment when feasible.

### Acceptance criteria

- Core user journeys work from start to finish.
- No critical integration failure remains.
- Accessibility and responsive requirements are checked.
- Error handling remains functional under failure conditions.
- The application can be set up using the documented instructions.
- Test failures are resolved or explicitly recorded with their impact.

## 16. Phase 13 — Release Preparation

### Tasks

- Verify the production frontend build.
- Verify backend startup under production configuration.
- Review deployment requirements.
- Confirm database migrations and backup procedures.
- Review runtime storage permissions.
- Verify environment configuration and secret handling.
- Review logs for unnecessary sensitive information.
- Update documentation to reflect actual implemented behavior.
- Prepare a list of known limitations.

### Acceptance criteria

- Production build succeeds.
- Deployment instructions match the actual repository.
- No private evidence or secrets are included in build artifacts.
- Core security and privacy checks have been completed.
- Remaining limitations are disclosed.
- The project is not described as production-ready unless the necessary verification has actually been completed.

## 17. Required Workflow for Every Vertical Slice

For each feature, follow this cycle:

1. Read the relevant specification.
2. Identify the user-visible behavior and acceptance criteria.
3. Define or confirm the API contract.
4. Implement the backend service and persistence behavior.
5. Implement the frontend interaction and states.
6. Connect the frontend to the real API.
7. Add or update automated tests.
8. Run the relevant tests and inspect their results.
9. Fix failures and regressions.
10. Verify the complete feature manually or through an end-to-end test.
11. Update documentation when implementation details change.
12. Mark the slice complete only when its acceptance criteria are met.

The exact order of backend and frontend coding within a slice may vary. The requirement is that the complete slice works before moving on.

## 18. Progress Tracking

Maintain a real implementation checklist in the project workspace.

For each phase, record:
- Status: not started, in progress, blocked, or verified.
- Implemented files or components.
- Tests executed.
- Actual test outcomes.
- Known limitations.
- Remaining blockers.

Do not mark work as verified because code was generated or because the interface looks correct.

## 19. Scope Control

If time or resources become limited:
- Prioritize the core upload-to-analysis-to-report workflow.
- Preserve privacy and security requirements.
- Reduce optional features before weakening essential safeguards.
- Do not substitute screenshots, hardcoded outputs, or fake APIs for working functionality.
- Document any feature deferred from the initial release.

## 20. Final Rule

Haven must be developed as a sequence of working, testable, integrated features.

A smaller application that honestly performs its stated functions is better than a large demo that only appears functional.


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
