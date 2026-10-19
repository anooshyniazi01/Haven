# Haven — Security Requirements

## 1. Purpose

This document defines the minimum security requirements for Haven.

Haven may handle sensitive images, incident descriptions, and evidence relating to blackmail or abuse. Security must therefore be considered throughout the application, not added only after the interface is complete.

All requirements must be implemented and tested as part of the relevant vertical slices.

## 2. Security Principles

- Treat every uploaded file and user-provided field as untrusted.
- Keep uploaded files outside publicly served frontend directories.
- Validate inputs on the backend.
- Store only the information needed for the application's functionality.
- Never expose secrets, internal paths, or sensitive evidence through errors or logs.
- Use established libraries instead of implementing cryptographic primitives manually.
- Fail safely when storage, database, or model operations fail.
- Do not claim a security property that has not been implemented and verified.

## 3. Threat Model Overview

Haven must account for these potential threats:

| Threat | Required protection |
|---|---|
| Malicious uploaded files | Content validation, size limits, safe decoding |
| Path traversal | Backend-generated storage keys and safe path handling |
| Oversized uploads | Server-side upload limits |
| Malformed image files | Controlled decoding and safe error handling |
| Database injection | SQLAlchemy parameterization and validated inputs |
| Cross-site scripting | Context-appropriate output escaping |
| Sensitive data exposure | Private storage, minimal logging, safe API responses |
| Accidental evidence loss | Controlled storage and deletion behavior |
| Model or dependency compromise | Verified sources, pinned dependencies, documented versions |
| Resource exhaustion | File limits, timeouts, bounded processing |
| Unauthorized access in future deployments | Authentication, authorization, and data isolation before public exposure |

This list is a starting point, not a guarantee that every possible attack is covered.

## 4. Upload Security

All uploads must be validated by the backend before processing.

Requirements:

1. Enforce a configurable maximum file size.
2. Reject empty files.
3. Inspect actual file content rather than trusting the extension or request MIME type.
4. Decode images using a maintained image-processing library.
5. Allow only explicitly supported formats.
6. Handle malformed and truncated files safely.
7. Apply reasonable image-dimension and decompression limits.
8. Reject files that exceed documented processing limits.
9. Generate safe server-side storage identifiers.
10. Never use a client-supplied filename directly as a filesystem path.
11. Avoid overwriting existing files.
12. Do not execute active content embedded in uploads.

The initial version should accept only the image formats explicitly supported by its analysis pipeline.

A file that passes format validation must not automatically be considered authentic or harmless.

## 5. Private File Storage

Uploaded images, preserved evidence, and derived artifacts must be stored outside the frontend's public asset directory.

Requirements:
- Use a dedicated application storage directory.
- Restrict access through backend-controlled operations.
- Never expose absolute storage paths through API responses.
- Do not construct public file URLs from internal storage identifiers.
- Use collision-safe file creation.
- Ensure temporary files are cleaned up appropriately.
- Handle partial writes and failed database transactions.
- Keep original evidence separate from transformed files.

The application must not rely on an obscure filename as its only security control.

If download or preview functionality is introduced, it must use a controlled backend route that verifies the requested resource and its access permissions.

## 6. Database Security

Use SQLAlchemy and parameterized database operations.

Requirements:
- Do not construct SQL statements by concatenating untrusted input.
- Validate UUIDs, status values, pagination parameters, and other structured fields.
- Use foreign keys and appropriate database constraints.
- Avoid returning raw database exceptions to the frontend.
- Keep database files outside public directories.
- Do not delete or reset an existing database automatically at startup.
- Test migrations against isolated databases.
- Keep database transactions consistent with associated file operations.

SQLite is appropriate for the initial local application. A future multi-user deployment must reassess database choice, concurrency, access control, and operational requirements.

## 7. API Security

All backend endpoints must validate incoming data.

Requirements:
- Use Pydantic request schemas.
- Enforce field length limits and allowed values.
- Return safe and consistent error responses.
- Do not reveal stack traces, secrets, internal paths, or private file contents.
- Apply appropriate request and processing limits.
- Avoid accepting unnecessary fields.
- Prevent unbounded list responses through pagination.
- Restrict CORS to explicitly configured development or deployment origins.
- Never use wildcard CORS with credentials.

CORS is a browser access policy, not authentication. It must not be treated as a substitute for authorization.

### Local application versus public deployment

The initial development version may run locally without a user-account system.

However, an application exposed to other users or the public must not rely on UUIDs, hidden routes, or CORS alone to protect evidence.

Before multi-user or public deployment, implement and test authentication, authorization, resource ownership checks, and data isolation.

## 8. Frontend Security

Requirements:
- Render user-controlled text using normal React escaping.
- Avoid unsafe HTML injection APIs.
- If rich HTML is ever required, use a suitable sanitization strategy.
- Do not place secrets in frontend environment variables.
- Do not treat client-side validation as security enforcement.
- Avoid storing sensitive evidence or authentication secrets in browser storage unnecessarily.
- Do not embed uploaded evidence into public URLs or third-party analytics.
- Handle API errors without displaying sensitive backend details.

Frontend environment variables must be considered public if they are bundled into the client application.

## 9. Secrets and Configuration

- Keep secrets out of source code and version control.
- Use environment variables or an appropriate local secret-management mechanism.
- Provide a sanitized `.env.example` when configuration is required.
- Add real `.env` files and secret files to `.gitignore`.
- Never include real credentials in documentation examples.
- Do not log secret values.
- Use separate development and production configuration where applicable.

If no secret is required for a feature, do not introduce one unnecessarily.

## 10. AI and Dependency Security

Requirements:
- Obtain model weights and dependencies from documented sources.
- Verify licenses and usage restrictions.
- Pin dependencies using the project's lockfiles.
- Prefer maintained packages and avoid unnecessary dependencies.
- Document model download and loading behavior.
- Do not download or execute arbitrary code from uploaded files.
- Do not silently fall back to an unverified model.
- Handle inference timeouts and resource failures.
- Validate model outputs before persistence or display.
- Do not send sensitive evidence to third-party services without a documented decision and clear disclosure.

Model predictions must not be treated as a security boundary or as proof of authenticity.

## 11. Logging and Error Handling

Logs should support debugging without exposing sensitive information.

Do not log by default:
- Raw image bytes.
- Full incident descriptions.
- Private evidence contents.
- Secrets or credentials.
- Full filesystem paths.
- Sensitive request bodies.

Use safe error categories and request identifiers where useful.

Detailed exceptions may be recorded in a restricted development log when necessary, but sensitive content must be redacted. Production logging must follow an explicitly defined policy.

The frontend should receive a safe message and stable error code rather than an internal traceback.

## 12. Resource Exhaustion

An attacker or accidental user error may submit files that consume excessive memory, CPU time, disk space, or model-processing capacity.

Requirements:
- Limit upload size.
- Limit decoded image dimensions and processing complexity.
- Apply timeouts where supported.
- Bound memory-intensive operations.
- Avoid processing unlimited files concurrently.
- Validate pagination limits.
- Handle unavailable storage and database resources.
- Return an appropriate error when processing cannot safely continue.

If processing is moved to background jobs later, queue size, retry behavior, job timeouts, and cleanup must also be specified.

## 13. Evidence Integrity

Use SHA-256 to calculate hashes of preserved file bytes.

Requirements:
- Compute the hash on the backend.
- Associate the hash with the exact stored file version.
- Recompute it when verification is required.
- Report mismatches instead of silently overwriting recorded values.
- Preserve originals separately from derivatives.
- Document transformations and their resulting hashes.

A matching hash indicates that compared bytes match. It does not prove original authenticity, identity, capture time, ownership, or legal chain of custody.

Do not claim that Haven provides forensic-grade chain of custody unless the relevant procedures and controls have actually been implemented and validated.

## 14. Deletion and Retention

Permanent deletion must not be implemented casually.

Before offering deletion, specify:
- What the user is deleting.
- Whether associated records or files are affected.
- How linked incidents and evidence are handled.
- How partial failures are recovered.
- What remains in logs or backups.
- Whether deletion is reversible.

Do not claim secure erasure without verified evidence that the relevant storage and copies have been handled appropriately.

The application must not silently destroy preserved evidence as a side effect of deleting an unrelated incident record.

## 15. External Network Requests

The initial version should favor local processing.

Before adding an external API, telemetry service, or remote model:
- Identify the destination.
- Document what data is transmitted.
- Explain the purpose.
- Assess privacy and retention implications.
- Disclose relevant behavior to users.
- Handle network failures safely.

Do not transmit private evidence merely to simplify implementation.

## 16. Security Testing

Test the following cases:

- Oversized upload.
- Empty upload.
- Incorrect file extension.
- Spoofed MIME type.
- Malformed image.
- Unsupported image format.
- Path traversal attempts.
- Unsafe filenames.
- Invalid UUIDs.
- Invalid incident statuses.
- SQL injection-style input.
- HTML and script-like text in user-controlled fields.
- Missing resources.
- Database failures.
- Storage failures.
- Model unavailable or timing out.
- Unexpected model output.
- Unauthorized resource access if authentication is introduced.
- Cross-user access attempts before any multi-user release.

Tests must use controlled fixtures and must not expose real sensitive evidence.

## 17. Security Acceptance Criteria

Haven is not ready for a release if:

- Uploaded files can be retrieved through unintended public paths.
- Client filenames can control storage paths.
- The backend trusts only file extensions or MIME headers.
- Sensitive evidence is included in ordinary logs.
- Internal stack traces are returned to users.
- Database errors cause false success responses.
- The application fabricates successful analysis results after failures.
- A future multi-user deployment exposes evidence without authorization checks.
- Deletion behavior can silently destroy linked evidence.
- Documentation claims security