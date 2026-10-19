# Haven Backend Engineering Skill

## 1. Purpose

Build Haven's backend as a reliable, testable, privacy-conscious service that supports real application functionality.

The backend owns authoritative validation, analysis orchestration, persistence, evidence-storage operations, and API error handling. The frontend must not be trusted to enforce security rules.

Follow the root `AGENTS.md` and the relevant specifications in `docs/`, especially:

- `docs/TECH_STACK.md`
- `docs/ARCHITECTURE.md`
- `docs/API_SPEC.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/DATA_DICTIONARY.md`
- `docs/ERROR_HANDLING.md`
- `docs/SECURITY.md`
- `docs/PRIVACY.md`
- `docs/EVIDENCE_HANDLING.md`
- `docs/TEST_PLAN.md`

## 2. Required Workflow

Before starting a task:

1. Read the root `AGENTS.md`.
2. Identify the current vertical slice in `docs/IMPLEMENTATION_PLAN.md`.
3. Inspect the existing backend implementation.
4. Read the applicable API, database, security, and product specifications.
5. Read this skill.
6. Implement only the current task and its necessary dependencies.
7. Run the relevant tests and checks before declaring completion.

Do not build all backend endpoints in advance while the frontend remains disconnected. Implement and verify the backend as part of the current end-to-end vertical slice.

## 3. Technology and Structure

Use the stack defined in `docs/TECH_STACK.md`:

- Python.
- FastAPI.
- Pydantic for request and response validation.
- SQLAlchemy for database access.
- Alembic for database migrations.
- SQLite for the approved initial database.
- pytest for backend tests.

Follow the repository layout defined in `docs/REPO_STRUCTURE.md`.

Keep responsibilities separated:

- API routes handle HTTP requests and responses.
- Pydantic schemas define validated API inputs and outputs.
- Services implement application logic.
- Repositories or the established database-access layer handle persistence.
- Database models represent persisted entities.
- Storage utilities manage evidence files.
- Analysis modules implement technical inspection and AI inference.
- Shared utilities handle narrowly defined reusable operations.

Avoid unnecessary abstractions. Do not introduce a second database-access pattern or competing service architecture without a documented reason.

## 4. API Contracts

`docs/API_SPEC.md` is the source of truth for endpoint behavior.

For every endpoint:

- Use the documented HTTP method and path.
- Validate inputs with appropriate schemas.
- Return the documented response structure.
- Use suitable HTTP status codes.
- Document any intentional contract changes.
- Keep frontend service types and backend schemas consistent.
- Avoid returning internal database objects directly.
- Do not expose storage paths, stack traces, internal exception messages, or secrets.

If a required contract is incomplete or contradictory, identify the issue and resolve it before making an incompatible implementation.

Do not silently rename fields, change response types, or alter error formats in ways that break existing clients.

## 5. Input Validation

Validate all untrusted input on the server.

This includes:

- Request bodies and query parameters.
- Identifiers and resource ownership or access permissions, where applicable.
- Uploaded file sizes and content.
- File formats and supported image types.
- Pagination and filtering parameters, if implemented.
- Any values used to construct filesystem paths or database queries.

Use explicit limits and documented validation rules.

Never rely only on file extensions, browser MIME types, or frontend checks to establish that an upload is safe.

Reject invalid input with a consistent, documented error response. Avoid returning unnecessary information about internal validation or infrastructure.

## 6. Database and Persistence

Follow `docs/DATABASE_SCHEMA.md` and `docs/DATA_DICTIONARY.md`.

- Use the approved schema and relationships.
- Keep database sessions and transactions properly managed.
- Use SQLAlchemy's safe query mechanisms.
- Apply migrations for schema changes.
- Avoid unnecessary queries and accidental repeated database access.
- Enforce applicable uniqueness, nullability, and integrity constraints.
- Handle missing records explicitly.
- Persist real application data rather than returning fabricated examples.
- Keep filesystem operations and database records consistent as far as the architecture allows.
- Handle partial failures when a file operation succeeds but a database operation fails, or vice versa.

Do not silently recreate, reset, or delete a database to make development easier.

If a schema change affects existing data, determine a safe migration strategy and test it where practical.

## 7. File Storage and Evidence

Follow `docs/SECURITY.md`, `docs/PRIVACY.md`, and `docs/EVIDENCE_HANDLING.md`.

- Keep uploaded evidence outside the frontend's public directory.
- Generate safe server-side filenames rather than trusting user-supplied filenames as paths.
- Enforce configured size and supported-format limits.
- Validate actual file content using an appropriate image-decoding or inspection method.
- Protect stored evidence from unintended public access.
- Restrict file access to the operations and users authorized by the approved architecture.
- Avoid reading an entire large file into memory when bounded or streaming operations are appropriate.
- Clean up temporary files after processing and handle failures safely.
- Never log evidence contents or sensitive personal data.
- Do not send uploaded evidence to an external service unless the approved design explicitly permits it and the required disclosure is in place.

Do not claim secure deletion, complete privacy, or tamper-proof storage unless the implementation and its limitations support that claim.

## 8. Hashing and Evidence Integrity

Use Python's standard `hashlib` implementation for SHA-256 when specified by the evidence-handling design.

- Calculate the digest from the actual file bytes.
- Record the algorithm and digest accurately.
- Recalculate the digest when the design requires an integrity check.
- Keep hash generation deterministic and test it against known inputs.

A matching SHA-256 digest indicates that the compared bytes match the recorded digest, assuming the hash record is trustworthy. It does not prove that an image is genuine, identify its creator, establish its origin, or prove when it was created.

Do not describe a hash as proof of authenticity or a complete chain of custody.

## 9. AI Analysis Integration

Follow `docs/AI_SPEC.md` and `docs/MODEL_EVALUATION.md`.

- Call the actual selected and documented analysis implementation.
- Validate the input before inference.
- Handle unsupported formats, decoding failures, resource limits, and inference errors.
- Return only results that the implemented method actually produces.
- Document model identity, relevant version information, and limitations where available.
- Keep technical inspection results distinct from model predictions.
- Preserve uncertainty in the response.
- Never convert an arbitrary score into an unsupported probability of manipulation.
- Never invent confidence scores, model explanations, or analysis findings.
- Do not label an image definitively authentic or manipulated based solely on model output.

If a suitable model is unavailable or cannot be integrated reliably, implement the approved technical-inspection functionality and clearly report that AI inference is not yet available. Do not substitute a hardcoded prediction.

## 10. Error Handling

Follow `docs/ERROR_HANDLING.md`.

- Use consistent error response structures.
- Map expected failures to appropriate HTTP status codes.
- Handle unexpected exceptions centrally where appropriate.
- Keep internal stack traces and sensitive diagnostics out of API responses.
- Log only the minimum safe diagnostic information required.
- Distinguish invalid input, missing resources, conflicts, unsupported files, processing failures, and unexpected server errors.
- Ensure a failed operation does not return a success response.
- Avoid swallowing exceptions without handling or reporting them.
- Do not expose filesystem paths, SQL details, environment variables, or credentials.

Error handling must help users recover without revealing implementation details.

## 11. Security and Configuration

Follow `docs/SECURITY.md` and the approved deployment configuration.

- Keep secrets in environment variables or an approved secret-management mechanism.
- Maintain an accurate `.env.example` containing placeholders only.
- Never commit actual credentials.
- Configure allowed origins deliberately rather than enabling unrestricted cross-origin access without justification.
- Apply request limits and timeouts where appropriate.
- Avoid unsafe dynamic evaluation, shell execution, and arbitrary path construction.
- Do not disable validation or access controls to make a request succeed.
- Do not claim authentication or authorization exists until it has actually been implemented and tested.
- Avoid collecting unnecessary personal data.
- Keep logs free of uploaded content, secrets, and unnecessary sensitive information.

Do not add external infrastructure, hosted services, or additional dependencies unless the approved architecture requires them or a justified decision is documented.

## 12. Performance and Reliability

- Set sensible limits for image dimensions, upload sizes, and computationally expensive operations.
- Handle image-decoding and inference failures without crashing the application.
- Avoid blocking unrelated requests with unnecessary long-running work.
- Do not introduce queues, distributed services, or background infrastructure unless the current requirements justify them.
- Use transactions and cleanup procedures where needed.
- Make retry behavior safe for operations that may be repeated.
- Avoid duplicate records or duplicate analysis jobs caused by accidental repeated requests.
- Keep health checks focused on the actual health information they are intended to report.

Do not add artificial sleeps or fabricated progress states to make operations appear more advanced.

## 13. Testing

Use pytest and the test structure defined in `docs/TEST_PLAN.md`.

Test the relevant behavior, including:

- Successful requests and documented response schemas.
- Invalid input and boundary conditions.
- Missing records and database constraints.
- Upload size, format, and content validation.
- Safe file naming and storage boundaries.
- Hash generation against known test files.
- Analysis success, unsupported input, and inference failure.
- Error response consistency.
- Persistence and database transaction behavior.
- Cleanup after partial failures.
- Privacy-sensitive logging behavior.
- Any applicable access-control behavior.

Use temporary test directories and isolated test databases where appropriate. Do not use real sensitive evidence in automated tests.

Mocks may be appropriate for isolated unit tests, but they do not prove that the real analysis implementation or complete application works end to end.

Run the relevant tests and report their actual results. Do not claim that tests pass if they were not executed.

## 14. Definition of Done

A backend task is complete only when:

- It follows the approved architecture and API contract.
- Inputs are validated on the server.
- Database and file operations behave correctly.
- Sensitive evidence is handled according to the approved security and privacy requirements.
- Errors are handled consistently.
- AI outputs, if applicable, are real and appropriately qualified.
- Relevant tests and available checks have been run.
- Related frontend integration is verified when required by the current vertical slice.
- Documentation is updated for intentional contract or behavior changes.
- Remaining limitations are explicitly reported.

The completion report must state what changed, what was tested, the actual outcomes, and anything still incomplete.