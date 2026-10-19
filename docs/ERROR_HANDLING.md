# Haven — Error Handling Specification

## 1. Purpose

This document defines how Haven detects, handles, reports, and recovers from errors.

Haven may process sensitive images, AI-generated assessments, evidence records, and incident information. Errors must be handled without exposing private information, corrupting records, or misleading users about whether an operation succeeded.

The application must never fabricate results, hide important failures, or report an operation as successful when its outcome is unknown.

## 2. Core Principles

1. **Be honest:** Display the actual outcome of an operation.
2. **Be understandable:** Explain the problem in plain language and provide a useful next step.
3. **Protect privacy:** Never expose stack traces, secrets, raw evidence, or sensitive filesystem paths in user-facing errors.
4. **Preserve consistency:** Prevent partial failures from creating misleading database records or file states.
5. **Fail safely:** Stop processing when required validation or security checks fail.
6. **Recover appropriately:** Offer retries only when they are safe.
7. **Keep errors distinguishable:** Separate validation errors, unavailable resources, permission failures, and unexpected server errors.
8. **Avoid false certainty:** If the application cannot determine whether an operation completed, communicate that uncertainty.
9. **Log responsibly:** Record useful diagnostic information without unnecessarily collecting sensitive data.
10. **Test failures:** Error behavior must be verified through automated tests, not merely documented.

## 3. Error Categories

### 3.1 Input validation errors

Examples:
- Unsupported file format.
- Corrupted image.
- Missing required field.
- Invalid evidence identifier.
- File exceeds the configured upload limit.
- Invalid incident information.

Expected behavior:
- Reject the invalid input before performing unnecessary processing.
- Return a clear explanation of the requirement.
- Preserve unrelated existing records.
- Do not create a completed evidence or analysis record for rejected input.

### 3.2 File and storage errors

Examples:
- Unable to create a storage file.
- Insufficient disk space.
- Stored file is missing.
- Permission denied.
- Temporary file cleanup fails.

Expected behavior:
- Do not report successful storage unless the file has been stored and verified according to the implementation's requirements.
- Avoid returning private filesystem paths.
- Clean up partial files where safe.
- Preserve valid existing evidence.
- Report when cleanup or recovery remains incomplete.

### 3.3 Database errors

Examples:
- Database unavailable.
- Transaction fails.
- Record not found.
- Constraint violation.
- Database migration missing or unsuccessful.

Expected behavior:
- Roll back failed transactions where supported.
- Avoid creating inconsistent record relationships.
- Return an appropriate error without exposing SQL statements or database internals.
- Do not silently replace real database operations with fabricated in-memory data.
- Report configuration or migration problems clearly during development.

### 3.4 AI inference errors

Examples:
- Model files are unavailable.
- Model loading fails.
- Unsupported image input.
- Preprocessing fails.
- Inference exceeds its time limit.
- Model output is invalid or incomplete.
- Insufficient resources are available.

Expected behavior:
- Mark the analysis as failed or unavailable, as appropriate.
- Preserve successfully stored evidence.
- Do not invent a prediction, confidence score, or explanation.
- Keep technical measurements that were successfully calculated, but distinguish them from the failed AI analysis.
- Allow a safe retry when the failure is temporary.
- Display a useful message without exposing model internals or private file paths.

### 3.5 Authorization and access errors

Examples:
- User attempts to access a record they do not own.
- Session is expired.
- Required permissions are missing.
- A protected file is requested without authorization.

Expected behavior:
- Deny the unauthorized operation.
- Avoid revealing whether another user's sensitive record exists when that distinction could expose private information.
- Do not return the requested file or record content.
- Record security-relevant events without logging sensitive evidence.
- Apply the same checks to API endpoints and file downloads.

### 3.6 Network and service errors

Examples:
- Frontend cannot reach the backend.
- Request times out.
- Backend returns an unexpected response.
- An optional external service is unavailable.

Expected behavior:
- Show a connection or service-unavailable message.
- Keep the interface usable where possible.
- Avoid endless loading indicators.
- Provide a retry option when appropriate.
- Do not claim that an external operation succeeded when the response is missing or ambiguous.

### 3.7 Unexpected application errors

Examples:
- Unhandled exception.
- Unexpected model output.
- Unanticipated database state.
- An unknown programming error.

Expected behavior:
- Catch unexpected errors at appropriate application boundaries.
- Return a generic error message to the user.
- Record safe diagnostic information for developers.
- Preserve already completed work where possible.
- Never expose raw stack traces in production responses.

## 4. API Error Response Format

FastAPI endpoints should use consistent error responses.

Use the following logical structure for application-specific errors:

```json
{
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "This image format is not supported.",
    "details": {
      "supported_formats": ["JPEG", "PNG", "WEBP"]
    },
    "request_id": "example-request-id"
  }
}
```

This example illustrates the response structure; it is not a real response or a generated identifier.

Requirements:

- `code`: Stable machine-readable error identifier.
- `message`: Short, safe explanation suitable for the frontend.
- `details`: Optional, non-sensitive information useful for correcting the request.
- `request_id`: Optional correlation identifier for troubleshooting.

Do not include stack traces, secrets, raw uploaded data, SQL statements, or unrestricted filesystem paths.

Validation errors should follow a consistent format even when FastAPI or Pydantic supplies the original validation details. Convert those details into safe, user-understandable responses where necessary.

The frontend must not assume every error response follows this exact structure. It should handle malformed responses and unexpected server errors safely.

## 5. HTTP Status Codes

Use HTTP status codes consistently.

| Status | Meaning | Example |
|---|---|---|
| `400` | Invalid request | Malformed request data |
| `401` | Authentication required | Missing or invalid authentication |
| `403` | Access denied | User lacks permission |
| `404` | Resource unavailable or not found | Evidence record cannot be retrieved |
| `413` | Request too large | Upload exceeds the configured limit |
| `415` | Unsupported media type | Unsupported uploaded format |
| `422` | Input validation failed | Invalid field or request structure |
| `429` | Rate limit exceeded | Too many requests |
| `500` | Unexpected server error | Unhandled application failure |
| `503` | Service temporarily unavailable | Required backend service is unavailable |

Use the status that best matches the actual failure. Do not return `200 OK` for a failed operation simply to simplify frontend handling.

For long-running analysis, distinguish between a successfully accepted or queued request and a completed analysis. A queued operation must not be represented as a completed result.

## 6. Frontend Error States

Every feature that communicates with the backend must handle at least these states where relevant:

- Initial or empty state.
- Loading.
- Success.
- Validation failure.
- Resource not found.
- Permission denied.
- Backend unavailable.
- Unexpected error.
- Retry in progress.

### 6.1 Loading states

- Show a clear indication when work is in progress.
- Disable duplicate submissions when necessary.
- Prevent repeated clicks from creating unintended duplicate operations.
- Avoid displaying infinite spinners.
- Provide cancellation only when the backend supports it safely.

### 6.2 Error messages

Messages should be concise and actionable.

Examples:

- Upload: "We couldn't upload this file. Check the format and size, then try again."
- Analysis: "Analysis couldn't be completed. Your saved evidence has not been intentionally replaced."
- Connection: "Haven couldn't reach the server. Check your connection and try again."
- Verification: "We couldn't verify this file because it was unavailable."
- Export: "The report couldn't be generated. Your saved records have not been intentionally changed."
- Deletion: "We couldn't confirm that all requested items were deleted. Check the evidence record before retrying."

Only make statements about preserved data when the implementation can support them. For example, if a storage failure may have partially changed state, the interface must not promise that everything remains unchanged.

### 6.3 Error presentation

- Keep messages near the relevant action.
- Use a consistent visual style for errors and warnings.
- Do not rely on color alone to communicate failure.
- Avoid generic alerts for every minor issue.
- Preserve useful user input when safe.
- Provide retry or recovery instructions when available.
- Never display sensitive error details merely to make debugging easier.

## 7. Upload Failure Handling

The upload workflow must distinguish between validation, storage, and persistence failures.

Expected sequence:

1. Receive the request.
2. Validate size and content.
3. Generate a server-controlled storage identifier.
4. Write the file safely.
5. Calculate the required hash.
6. Persist the evidence record.
7. Confirm success only when the required operations have completed.

The exact ordering may differ if the implementation uses a safer transactional workflow, but the resulting behavior must remain consistent.

If any required step fails:

- Do not mark the evidence as fully stored.
- Remove partial artifacts where safe.
- Avoid deleting unrelated or previously stored files.
- Return an appropriate error.
- Handle cleanup failures explicitly.

Because filesystem writes and database transactions cannot generally be committed as one atomic operation, implement a documented recovery strategy for orphaned files or incomplete records.

## 8. AI Analysis Failure Handling

AI analysis must be independent of successful evidence storage.

If evidence is stored successfully but inference fails:

- Keep the stored evidence available.
- Mark the analysis as failed or unavailable.
- Preserve any independently valid technical measurements.
- Do not create a completed analysis result from missing model output.
- Show the failure and provide a safe retry option if appropriate.

If model loading fails at application startup, report the service's unavailable state. Do not silently substitute a different model or a hardcoded result.

If an alternative model is intentionally supported, its selection and behavior must be documented, and its outputs must be identified accurately.

## 9. Database and File Consistency

Operations involving both the database and filesystem require special care.

Required safeguards:

- Use database transactions for related database changes.
- Validate referenced records before modifying them.
- Check whether a file is still referenced before deleting it.
- Handle missing files without crashing unrelated features.
- Avoid leaving completed database records that reference nonexistent files.
- Implement recovery or cleanup for partial operations.
- Make retries safe where possible.

If an operation cannot be made atomic, document its intermediate states and recovery rules.

A cleanup job must never delete evidence merely because a record could not temporarily be read. Cleanup should use explicit criteria and safe verification.

## 10. Retry and Idempotency

Retries can cause duplicate records or repeated destructive actions if implemented carelessly.

A retry is appropriate when:
- The error is likely temporary.
- Repeating the operation will not cause unintended side effects.
- The system can determine whether a previous attempt already completed.

For operations that may be repeated, use an appropriate idempotency strategy where needed.

Examples:
- Retrying a read request is generally safe.
- Retrying a failed upload may create duplicates unless the request or record state is checked.
- Retrying analysis may create multiple analysis records unless the intended behavior is defined.
- Retrying deletion must handle records that were already removed.
- Retrying report generation should not create uncontrolled temporary files.

Do not automatically retry authorization failures, invalid input, or other errors that require user or operator action.

If the outcome of a previous request is unknown, first determine its state when possible instead of blindly repeating the operation.

## 11. Logging and Diagnostics

Logs should help developers diagnose problems without exposing sensitive evidence.

Appropriate diagnostic fields may include:

- Timestamp.
- Request or correlation identifier.
- Endpoint or operation name.
- Safe error code.
- HTTP status.
- Processing stage.
- Exception category.
- Non-sensitive timing or resource information.

Avoid logging:

- Raw image bytes.
- Full incident narratives.
- Passwords, tokens, or API keys.
- Unnecessary personal information.
- Complete request bodies containing sensitive data.
- Sensitive absolute filesystem paths.
- Full model inputs or outputs when they contain private information.

In development, detailed stack traces may be available in the developer console. Production responses must remain generic and safe.

Logs must not become an alternative storage location for evidence.

## 12. Error Boundaries and Component Failures

The React frontend should use suitable error boundaries around major interface areas.

An error boundary can prevent certain rendering errors from crashing the entire interface, but it does not replace handling for failed API requests or asynchronous operations.

Requirements:

- Provide a recovery action when a component fails.
- Preserve unrelated navigation and interface areas where possible.
- Avoid displaying raw exception messages to users.
- Handle rejected promises and failed network requests explicitly.
- Keep developer diagnostics separate from user-facing messages.

FastAPI should also have centralized exception handling for unexpected application errors while preserving appropriate HTTP status codes and safe validation messages.

## 13. Development and Production Behavior

### Development

- Provide useful diagnostics to the developer.
- Log unexpected exceptions safely.
- Make configuration and migration problems easy to identify.
- Keep test failures visible.
- Do not use fake successful responses to bypass broken functionality.

### Production

- Disable debug mode and public stack traces.
- Use generic unexpected-error responses.
- Protect diagnostic logs.
- Validate required configuration at startup.
- Avoid exposing secrets or internal implementation details.
- Return accurate status codes.
- Keep security controls active even when optional features fail.

Environment-specific behavior must not weaken core evidence privacy or access controls.

## 14. Required Tests

Automated tests should verify:

- Invalid uploads return appropriate error responses.
- Oversized files are rejected.
- Storage failures do not create false success states.
- Hash calculation failures are handled safely.
- Database transaction failures do not leave misleading completed records.
- AI inference failures do not produce fabricated analysis.
- Missing evidence is not reported as verified.
- Unauthorized requests do not return protected data.
- Unexpected backend exceptions do not expose stack traces.
- Frontend loading indicators stop after a completed or failed request.
- Retry actions do not create unintended duplicate operations.
- Deletion failures are reported accurately.
- PDF generation failures do not return a successful empty report.
- Logs do not contain sensitive evidence or credentials.
- Error messages remain understandable and accessible.

Use automated tests against the actual services and API behavior. Mock external dependencies only when the test specifically targets a component in isolation; also test the integrated behavior using the real configured local components.

## 15. Acceptance Criteria

Error handling is ready for integration when:

- [ ] API errors follow a consistent, documented structure.
- [ ] HTTP status codes reflect actual outcomes.
- [ ] User-facing errors are clear and safe.
- [ ] Unexpected errors do not expose sensitive internal details.
- [ ] Upload and storage failures are handled without false success.
- [ ] AI failures never produce invented results.
- [ ] Database and filesystem inconsistencies have a recovery strategy.
- [ ] Retry behavior is safe for operations that may be repeated.
- [ ] Logs exclude sensitive evidence and credentials.
- [ ] Frontend features display meaningful loading, success, and failure states.
- [ ] Automated tests cover expected failures and important edge cases.

## 16. Final Principle

An error is not merely a message to display. It is a state the application must handle correctly.

Haven must tell the truth about what happened, protect the user's information, preserve valid records wherever possible, and provide a safe next step when an operation cannot be completed.