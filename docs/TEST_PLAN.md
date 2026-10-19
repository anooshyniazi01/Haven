# Haven — Test Plan

## 1. Purpose

This document defines the testing strategy for Haven. It specifies how individual components, complete user workflows, security controls, AI analysis, and the overall application must be verified.

Haven handles sensitive media and may produce AI-assisted assessments related to image manipulation. Testing must therefore verify not only functionality but also data integrity, privacy, security, reliability, and the accuracy of claims presented to users.

A feature is not complete merely because its interface renders or its code has been written. It must meet its acceptance criteria and pass the relevant tests.

## 2. Testing Principles

1. Test actual functionality rather than visual appearance alone.
2. Build and verify one vertical slice at a time.
3. Test both successful operations and realistic failure scenarios.
4. Never use fabricated production results to make a feature appear functional.
5. Use synthetic or public test data rather than real sensitive evidence.
6. Test security and privacy controls alongside normal functionality.
7. Evaluate AI behavior using documented datasets and metrics.
8. Reproduce and fix failures before continuing to dependent features.
9. Run relevant regression tests whenever existing behavior changes.
10. Report actual test results; never claim that an unexecuted test has passed.

## 3. Testing Stack

Use the following tools where appropriate:

| Area | Tool |
|---|---|
| Backend unit and integration tests | pytest |
| API testing | FastAPI TestClient or HTTPX |
| Frontend unit and component tests | Vitest |
| Frontend component testing | React Testing Library |
| End-to-end browser testing | Playwright |
| Database tests | pytest with isolated test databases |
| Static type checking | TypeScript compiler |
| Frontend linting | Configured ESLint rules |
| Python linting | A selected Python linter, if configured |
| AI model evaluation | Python evaluation scripts and documented metrics |
| Dependency security checks | Suitable dependency auditing tools |

Use the tools already selected for the project. Do not introduce additional testing frameworks without a practical reason.

## 4. Testing Levels

### 4.1 Unit testing

Test individual functions and components in isolation.

Examples:
- File validation functions.
- SHA-256 calculation.
- Hash comparison.
- Metadata extraction.
- Input validation.
- Error response formatting.
- Database model constraints.
- React components and form validation.
- Report formatting functions.

Unit tests should be fast, repeatable, and independent of unrelated services.

### 4.2 Integration testing

Test interactions between connected components.

Examples:
- API endpoint to database.
- Upload endpoint to filesystem storage.
- Upload workflow to hash calculation.
- Evidence retrieval to access control.
- Analysis service to the selected model.
- Analysis results to database persistence.
- Database records to PDF export.

Integration tests must verify that data moves correctly across component boundaries.

### 4.3 End-to-end testing

Test complete user journeys through the actual frontend and backend.

Examples:
- Upload an image and view the stored evidence.
- Run an available analysis and view its actual result.
- Open a saved evidence record and verify its hash.
- Associate evidence with an incident.
- Export a report containing the intended records.
- Delete an evidence item and confirm the documented deletion outcome.

Use a real browser and running application for the end-to-end workflows. Do not replace the actual backend with hardcoded frontend responses.

### 4.4 Security testing

Verify that untrusted input, unauthorized access, and failure conditions cannot bypass required controls.

Security tests should include malformed uploads, path traversal attempts, unsafe text rendering, record access restrictions, sensitive logging, and storage exposure.

### 4.5 AI evaluation

Evaluate the actual selected model or analysis method using suitable test data and documented metrics.

A passing software test does not establish that an AI model is accurate or forensically reliable. Model evaluation must be reported separately from application functionality.

## 5. Test Environment

Maintain a dedicated test configuration.

Requirements:

- Use a separate test database.
- Use temporary storage directories for file-related tests.
- Use synthetic or appropriately licensed public test images.
- Keep test artifacts outside production storage.
- Do not use real personal images, blackmail evidence, or private incident records in automated tests.
- Keep credentials and secrets out of test fixtures and source control.
- Make tests reproducible using documented setup instructions.
- Clean up temporary files and records after tests.
- Avoid tests that depend on the developer's personal filesystem paths.

Where SQLite behavior differs from the intended production database, add appropriate tests for the production configuration before deployment.

## 6. Test Data

Prepare a documented test dataset containing:

- A valid JPEG image.
- A valid PNG image.
- A valid WebP image if supported.
- An unsupported file format.
- A corrupted image.
- An image with a misleading extension.
- An image exceeding the configured size limit.
- An image with unusually large dimensions.
- A zero-byte file.
- A file with selected metadata fields.
- A file without optional metadata.
- A synthetic pair of identical files.
- A synthetic pair of files with different bytes.
- Suitable images for AI evaluation, when a valid evaluation dataset is available.

Use fixed test fixtures where deterministic output is required.

For files with metadata or transformations, document the expected properties of each fixture. Do not assume that changing an image's visual appearance will necessarily cause an AI model to classify it correctly.

## 7. Backend Tests

### 7.1 File validation

Verify that:

- Valid supported images are accepted.
- Unsupported formats are rejected.
- Corrupted images are rejected safely.
- File signatures and decoded content are checked.
- Misleading extensions do not bypass validation.
- Oversized uploads are rejected.
- Excessive image dimensions are handled within configured limits.
- Missing input produces an appropriate error.
- Malformed requests do not crash the server.

### 7.2 Hashing and integrity

Verify that:

- SHA-256 is calculated from the actual received file bytes.
- Hashes are stored with the correct evidence records.
- Identical byte sequences produce matching hashes.
- Different test byte sequences produce different hashes for the selected fixtures.
- Verification recalculates the hash from the current stored file.
- Modified test files produce a mismatch against the original recorded hash.
- Missing files produce an unavailable or error result rather than a match.
- Invalid hash records are handled safely.
- The interface and API do not claim that a matching hash proves authenticity.

### 7.3 Database behavior

Verify that:

- Evidence records are created only after the required operations succeed.
- Analysis records reference the correct evidence.
- Invalid relationships are rejected.
- Failed transactions do not leave misleading completed records.
- Deleted records follow the documented relationship and retention rules.
- Queries do not expose unrelated records.
- Database failures produce controlled errors.

### 7.4 API behavior

Verify that:

- Valid requests return the documented responses.
- Invalid requests return appropriate status codes.
- Error responses follow the documented structure where applicable.
- Missing resources are handled consistently.
- Unauthorized requests are denied when access controls apply.
- Unexpected exceptions do not expose stack traces in production responses.
- Repeated requests behave according to the documented idempotency rules.

## 8. Frontend Tests

Verify that:

- Forms validate required fields.
- Upload progress or loading states appear when appropriate.
- Users receive clear success and failure messages.
- Backend errors are displayed safely.
- Empty states accurately reflect real database contents.
- Loading indicators stop when requests finish or fail.
- Duplicate submissions are prevented where necessary.
- Navigation works across implemented screens.
- Saved records display actual backend data.
- Analysis screens distinguish technical measurements from AI assessments.
- Hash verification displays the real verification outcome.
- Destructive actions require appropriate confirmation.
- Export controls handle failures correctly.
- The interface remains usable on supported screen sizes.

Test both normal user interactions and unexpected API responses.

## 9. AI Analysis Tests

### 9.1 Functional checks

Verify that:

- The configured model or analysis method loads successfully.
- Supported inputs reach the actual analysis pipeline.
- Preprocessing follows the documented procedure.
- Inference returns the expected output structure.
- Invalid or unsupported inputs are handled safely.
- Model loading and inference failures produce honest error states.
- Saved analysis records identify the actual model or method version.
- Results are persisted and retrieved correctly.
- The application never substitutes fabricated predictions for failed inference.

### 9.2 Output validation

Verify that:

- Returned values satisfy the documented output schema.
- Probabilities or scores, if used, fall within their defined valid ranges.
- Class labels correspond to the selected model's documented outputs.
- Unsupported values are rejected or handled safely.
- Missing outputs do not become invented explanations.
- Any displayed confidence information is correctly interpreted and labeled.

A model's confidence score must not automatically be described as the probability that an image is authentic or manipulated unless that interpretation is justified by appropriate calibration and evaluation.

### 9.3 Model performance evaluation

Use a suitable labeled dataset with documented inclusion criteria and data provenance.

Where feasible, separate training, validation, and test data appropriately. Avoid leakage between related images or near-duplicate samples.

Report suitable metrics, including:

- Precision.
- Recall.
- F1-score.
- Confusion matrix.
- False-positive rate.
- False-negative rate.
- Performance by relevant image categories or manipulation types.
- Processing time and resource usage.

Include sample sizes, evaluation limitations, and relevant class imbalance information.

Do not report model performance without actually running the evaluation. If no suitable dataset or validated model is available, document the limitation and restrict the claims Haven makes.

## 10. Security and Privacy Tests

Verify that:

- Uploaded files cannot be retrieved through unintended public paths.
- Filenames cannot cause path traversal or unintended overwrites.
- Malicious filenames and notes render as text.
- SQL injection attempts cannot alter query structure.
- Protected records cannot be accessed without appropriate authorization.
- Sensitive evidence is not written to ordinary application logs.
- Environment secrets are not exposed in frontend bundles.
- Temporary files are handled according to the documented cleanup policy.
- Exported reports contain only the intended records.
- Deletion reports reflect actual outcomes.
- External services do not receive evidence without the documented authorization and disclosure.
- Test data and private records are excluded from public repository content.
- Production error responses do not reveal sensitive internals.

For a local single-user prototype, test the controls that apply to that architecture and explicitly document controls that require a future multi-user deployment.

## 11. Evidence and Report Tests

Verify that:

- Stored evidence matches the bytes received during upload.
- Analysis does not overwrite the original evidence.
- Derived artifacts are stored and labeled separately.
- Hash records are associated with the correct file.
- Verification compares actual stored bytes.
- Reports include the correct evidence and analysis identifiers.
- Reports distinguish user-provided descriptions from model-generated assessments.
- Reports include appropriate limitations.
- PDF generation handles missing or incomplete records safely.
- Export failures do not produce false success messages.
- Temporary export artifacts are cleaned up where required.

## 12. Incident Tracker and Safety Guide Tests

### Incident Tracker

Verify that:

- Incident records can be created using valid input.
- Required fields are validated.
- Records persist across application restarts where expected.
- Evidence associations reference the correct records.
- Editing and deletion follow documented behavior.
- Unauthorized access is prevented where applicable.
- Exported incident information does not include unrelated records.

### Safety Guide

Verify that:

- Guidance is readable and clearly organized.
- Links work and point to the intended resources.
- Safety guidance avoids blaming the user or encouraging confrontation.
- Legal or emergency claims are appropriately qualified.
- Missing external resources do not crash the application.
- The interface does not present generic guidance as a personalized professional assessment.

## 13. End-to-End Test Scenarios

### Scenario A — Upload and view evidence

1. Open Haven.
2. Navigate to the upload interface.
3. Select a supported test image.
4. Submit the upload.
5. Confirm that validation and storage complete successfully.
6. Confirm that the evidence appears in the relevant interface.
7. Retrieve the saved record through the backend.
8. Verify that the file and database record correspond correctly.

Expected result: The actual image is stored and displayed through the intended private workflow.

### Scenario B — Reject an invalid file

1. Select a corrupted or unsupported test file.
2. Submit the upload.
3. Observe the API response and frontend message.
4. Inspect the test database and temporary storage.

Expected result: The file is rejected, no false success is shown, and no unintended persistent evidence record remains.

### Scenario C — Analyze stored evidence

1. Upload a suitable test image.
2. Request analysis.
3. Wait for the actual configured analysis method.
4. View the returned result.
5. Inspect the saved analysis record.

Expected result: The application displays the actual output and identifies the method used. If inference fails, it shows an honest failure state.

### Scenario D — Verify file integrity

1. Upload a test image.
2. Record its calculated SHA-256 hash.
3. Run integrity verification without changing the file.
4. Confirm a match.
5. In an isolated test fixture, modify the stored file.
6. Run verification again.

Expected result: The first verification matches the recorded baseline and the modified file produces a mismatch. The application explains what this comparison does and does not prove.

### Scenario E — Export a report

1. Create a test evidence record.
2. Complete an actual analysis if the configured method is available.
3. Request a report export.
4. Open the generated PDF.
5. Check its identifiers, hash information, analysis details, and limitations.

Expected result: The PDF reflects the actual saved records and excludes unrelated information.

### Scenario F — Delete evidence

1. Create a test evidence record and any supported related records.
2. Request deletion.
3. Inspect the resulting database state and application-managed file storage.
4. Check the interface and deletion response.

Expected result: The deletion outcome matches the documented policy, and the application does not claim that unmanaged copies or backups were erased.

### Scenario G — Recover from backend failure

1. Start Haven normally.
2. Temporarily make the backend unavailable in the test environment.
3. Attempt an operation that requires the backend.
4. Observe loading and error states.
5. Restore the backend and retry.

Expected result: The frontend shows a controlled error, avoids an infinite loading state, and recovers when the service is available again.

### Scenario H — Verify access restrictions

For a deployment with authentication:

1. Create two test users.
2. Create evidence under the first account.
3. Attempt to retrieve or modify that evidence using the second account.
4. Test the same restrictions across file retrieval, analysis, incidents, and exports.

Expected result: The second user cannot access or modify the first user's protected records.

## 14. Regression Testing

After changing a feature, rerun its relevant tests and any tests affected by shared code or data structures.

Examples:

- Changing file validation requires upload and security regression tests.
- Changing the evidence schema requires database, API, and export tests.
- Changing model preprocessing requires AI evaluation and analysis integration tests.
- Changing deletion logic requires evidence, incident, and cleanup tests.
- Changing authentication requires access-control tests across all protected endpoints.
- Changing report generation requires export and privacy tests.

Run the complete relevant suite before considering a significant change finished.

## 15. Vertical Slice Verification

Haven must be implemented and tested one complete feature at a time.

For each vertical slice:

1. Define the feature's acceptance criteria.
2. Implement the necessary interface.
3. Connect it to the real API.
4. Implement the backend behavior.
5. Connect the database or analysis method where required.
6. Add unit and integration tests.
7. Test the feature through the actual interface.
8. Fix failures before proceeding.
9. Run relevant regression tests.
10. Record the actual verification result.

Do not build the entire frontend first and postpone backend integration. Do not build disconnected backend endpoints that the interface never uses.

## 16. Test Execution and Reporting

Document test execution honestly.

For each test run, record:

- Date and environment.
- Command or test suite executed.
- Number of tests passed, failed, skipped, or not run, where available.
- Failure details and relevant reproduction steps.
- Known limitations.
- Required fixes.
- Whether the affected feature is ready for further development.

A test that was not executed is **not tested**, not passed.

A skipped test must include a reason. A failing test must not be hidden or removed merely to obtain a passing suite.

Example commands for the selected stack:

```bash
# Backend
pytest

# Frontend
npm run test

# TypeScript validation, if configured
npx tsc --noEmit

# Production build, if configured
npm run build
```

Use the scripts actually defined in the project's configuration. If a command is unavailable, inspect the project setup and document the correct command rather than claiming it succeeded.

## 17. Definition of Done

A feature is considered complete when:

- [ ] Its documented acceptance criteria are met.
- [ ] The frontend is connected to the actual backend where required.
- [ ] Data is persisted and retrieved correctly where required.
- [ ] Relevant unit tests pass.
- [ ] Relevant integration tests pass.
- [ ] Relevant end-to-end checks pass.
- [ ] Error states and important edge cases are handled.
- [ ] Security and privacy requirements are verified.
- [ ] Existing functionality has not regressed.
- [ ] Known limitations are documented.
- [ ] Test results accurately reflect what was executed.

For AI features, model evaluation and its limitations must also be documented separately.

## 18. Release Readiness

Before a public release:

- Run the relevant complete test suites.
- Verify production configuration and database migrations.
- Review unresolved security issues.
- Confirm that sensitive evidence is not publicly accessible.
- Check that model claims match the available evaluation evidence.
- Verify report export and deletion behavior.
- Confirm that secrets and real evidence are absent from the public repository.
- Test the production build and critical user journeys.
- Document known limitations and deployment requirements.

Passing automated tests does not guarantee the absence of defects or establish legal or forensic reliability.

## 19. Final Principle

Haven must earn trust through verified behavior, not polished screens or confident claims.

Every important feature must be tested with real application behavior, honest failure handling, and evidence that the implementation meets its documented requirements.