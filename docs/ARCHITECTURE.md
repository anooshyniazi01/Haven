# Haven — Software Architecture

**Document version:** 1.0  
**Status:** Proposed MVP architecture

## 1. Architectural Goals

Haven's architecture must support:

- A responsive, maintainable frontend.
- A clear API boundary between frontend and backend.
- Reliable database persistence.
- Safe handling of uploaded media.
- Isolated, testable AI inference.
- Explainable analysis reports.
- Evidence and incident management.
- Practical integration and end-to-end testing.

The initial application will use a modular monolith architecture.

The frontend and backend may run as separate development processes, but the backend's business logic will remain organized into modules within one application.

Do not introduce microservices without a documented requirement.

## 2. High-Level Architecture

```text
                         USER
                           |
                           v
                  React + TypeScript
                    Frontend (Vite)
                           |
                           | HTTP / JSON
                           | Multipart upload
                           v
                    FastAPI Application
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
        API Routes      Services       Schemas
             |             |
             |             +------------------------+
             |             |            |           |
             v             v            v           v
        Repositories   Media Storage  AI Service  Report Service
             |             |            |           |
             v             |            v           |
           SQLite          |       Model Inference  |
             ^             |            |           |
             |             v            v           v
             +-------- File Metadata  Analysis   PDF Output
                         and Files     Results
```

This diagram represents logical responsibilities, not a requirement to create separate deployable services.

## 3. Frontend Architecture

### 3.1 Responsibilities

The frontend is responsible for:

- Displaying the user interface.
- Collecting and validating user input for usability.
- Uploading files.
- Calling backend endpoints.
- Displaying actual API responses.
- Showing loading, success, empty, and error states.
- Presenting analysis results and their limitations.
- Supporting navigation between related records.

The frontend must not independently invent analysis results or make security-sensitive decisions that belong on the backend.

### 3.2 Feature organization

Organize frontend code around product features, such as:

- Dashboard.
- Media analysis.
- Analysis reports.
- Evidence Vault.
- Incident Tracker.
- Safety Guide.

Shared components, API utilities, layouts, types, and design tokens should live in appropriate shared locations.

Keep feature-specific logic close to the feature that uses it.

### 3.3 API boundary

Frontend components should use a shared API layer rather than embedding fetch logic throughout the application.

The API layer should handle:

- Backend base URL configuration.
- JSON requests and multipart uploads.
- Response parsing.
- HTTP error handling.
- Consistent TypeScript request and response types.

The backend remains the source of truth for persisted records and analysis results.

## 4. Backend Architecture

### 4.1 API routes

API routes receive HTTP requests, validate request data, call the relevant services, and return appropriate responses.

Routes should not contain large blocks of unrelated business logic.

### 4.2 Schemas

Schemas define the structure and validation rules for API requests and responses.

Keep external API contracts distinct from internal database models where appropriate.

### 4.3 Services

Services implement application workflows and business rules.

Examples include:

- Media upload and validation.
- Media analysis orchestration.
- Evidence management.
- Incident management.
- Report generation.
- Dashboard summaries.

Services should be testable without requiring the frontend.

### 4.4 Repositories and data access

Repositories or a similarly consistent data-access layer manage database operations.

Keep database queries and persistence logic out of frontend code and avoid scattering database operations across unrelated modules.

Do not introduce abstractions that add complexity without improving testability or maintainability.

### 4.5 Models

Database models represent persisted entities and their relationships.

Use database constraints and appropriate transaction handling to maintain data integrity.

## 5. Media Upload and Storage Architecture

The upload workflow is:

1. The frontend sends a file to the upload endpoint using multipart form data.
2. The backend checks request size limits and validates the file.
3. The backend verifies the actual file content using appropriate parsing or decoding.
4. The backend generates an internal identifier.
5. The storage service saves the file outside the public frontend directory.
6. The application records relevant metadata in SQLite.
7. The API returns the saved record's identifier and permitted metadata.
8. The frontend displays the actual result.

### Storage rules

- Do not trust user-provided filenames as filesystem paths.
- Do not trust MIME types or file extensions without content validation.
- Reject malformed or unsupported files.
- Enforce configured size limits.
- Avoid loading arbitrarily large files into memory.
- Handle partial failures between file storage and database persistence.
- Prevent unauthorized file retrieval.
- Never expose internal storage paths to the browser.

### Consistency

File storage and SQLite do not share a single transaction.

The implementation must account for failures such as a file being saved while its database insert fails.

Use cleanup or reconciliation logic appropriate to the workflow so failed uploads do not leave uncontrolled orphaned files.

## 6. AI Analysis Architecture

### 6.1 Analysis workflow

1. The frontend requests analysis of an existing uploaded image.
2. The backend verifies that the image record exists and that the requested operation is permitted.
3. The backend resolves the stored file through the storage service.
4. The analysis service validates the input and applies the documented preprocessing pipeline.
5. The inference component loads or reuses the configured model.
6. The model processes the image.
7. The inference output is checked for validity.
8. The analysis service creates a structured result with available method and model metadata.
9. The backend persists the analysis record.
10. The API returns the saved analysis identifier and permitted result data.
11. The frontend displays the result and its limitations.

### 6.2 Separation of responsibilities

The AI inference component must not be responsible for:

- Handling HTTP requests directly.
- Writing arbitrary database records.
- Managing frontend state.
- Generating unsupported narrative claims.

The application service coordinates inference, validation, persistence, and error handling.

### 6.3 Model lifecycle

Load the model in a controlled way and reuse it when practical.

Avoid loading large model weights from scratch on every request unless the selected deployment constraints require that behavior.

Handle missing weights, incompatible dependencies, unsupported inputs, memory exhaustion, and inference failures explicitly.

If inference fails, do not create a completed analysis record containing fabricated predictions.

### 6.4 Result interpretation

Store the actual model output and the relevant interpretation metadata.

Do not convert an arbitrary model score into a probability without calibration evidence.

Reports must distinguish model output, computed signals, interpretation, and conclusions that cannot be established.

## 7. Database Architecture

SQLite will store structured application records.

The initial logical entities are:

- Uploaded media.
- Analysis results.
- Evidence records.
- Incidents.
- Incident timeline events.
- Relationships between incidents and evidence.
- Relevant report metadata, if required by the implementation.

### Database principles

- Use stable identifiers.
- Define explicit relationships.
- Add timestamps where they serve a clear purpose.
- Use appropriate constraints and indexes.
- Use migrations for schema changes.
- Handle missing records consistently.
- Keep file contents in file storage rather than storing large image binaries in ordinary database fields.
- Do not duplicate the same data unnecessarily across records.

The final table design will be specified in `DATABASE_SCHEMA.md`.

## 8. Evidence and Incident Relationships

An uploaded image, an AI analysis, an evidence record, and an incident are different concepts.

An uploaded image represents a stored file.

An analysis represents the output of a particular analysis operation on a file.

An evidence record represents an item that the user chooses to organize or preserve.

An incident represents a situation documented by the user.

An incident may be linked to multiple evidence records. An image may have multiple analyses over time.

Use explicit relationships so that reports and incident views retrieve the correct records.

Do not automatically treat every uploaded image as evidence for an incident without a clear product decision.

## 9. Report Generation Architecture

The report service receives a request to export a selected saved record or incident.

Its workflow is:

1. Validate the requested report target.
2. Retrieve the relevant persisted records.
3. Resolve the intended report contents.
4. Generate the PDF using the selected PDF library.
5. Handle layout, pagination, and missing optional fields.
6. Return the generated file through an appropriate response.
7. Clean up temporary report files according to the documented policy.

The report must use saved information, not unsaved frontend-only state.

Do not include unrelated sensitive records in an export.

## 10. Error Handling

Use consistent error responses across the API.

Errors should distinguish, where appropriate:

- Invalid input.
- Unsupported media.
- Oversized uploads.
- Missing records.
- Conflicting operations.
- Unavailable model or inference failure.
- Storage failure.
- Database failure.
- Internal application failure.

The frontend should translate these errors into understandable messages.

Detailed internal exceptions may be logged safely for debugging, but sensitive content and internal filesystem paths must not be returned to users.

Do not silently swallow exceptions or report success after a failed operation.

## 11. Configuration and Environment Separation

Use environment-based configuration for settings such as:

- Database location.
- File storage directory.
- Upload size limit.
- Allowed file formats.
- Model configuration and location.
- Frontend API base URL.
- Logging configuration.

Keep local configuration and generated data out of version control when appropriate.

Provide example environment files with placeholder values only.

Validate essential configuration at startup.

## 12. Testing Architecture

Tests should cover the appropriate layers:

### Unit tests

Test focused functions and services, including validation, business rules, and result interpretation.

### API tests

Test request validation, response schemas, status codes, and error handling.

### Database tests

Test persistence, relationships, missing records, and transactions using an isolated test database.

### AI tests

Test input preprocessing, output validation, inference failures, and model integration where the test environment supports it.

Do not require a large model download for every ordinary unit test. Use clearly identified test doubles for isolated tests, and separate them from tests that verify real inference.

### End-to-end tests

Verify complete user workflows through the running frontend and backend.

A passing unit test alone does not establish that the entire application works.

## 13. Security Boundaries

Treat the frontend as untrusted.

The backend must independently validate user input, file operations, identifiers, and any access restrictions.

Keep uploaded files outside public web roots.

Avoid logging sensitive incident descriptions, file contents, secrets, or tokens.

Do not send sensitive media to external services without a documented decision and appropriate user disclosure.

If authentication is introduced, enforce authorization on the backend rather than relying on hidden frontend buttons.

The deployment-specific security model must be documented before public deployment.

## 14. Initial Repository Organization

The intended code organization is:

```text
Haven/
├── AGENTS.md
├── docs/
├── frontend/
│   └── src/
│       ├── app/
│       ├── routes/
│       ├── components/
│       ├── features/
│       ├── layouts/
│       ├── hooks/
│       ├── lib/
│       ├── services/
│       ├── types/
│       ├── styles/
│       └── tests/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── schemas/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── security/
│   │   ├── storage/
│   │   ├── ai/
│   │   └── reports/
│   ├── migrations/
│   └── tests/
├── ml/
│   ├── README.md
│   ├── MODEL_CARD.md
│   ├── EVALUATION_PROTOCOL.md
│   ├── inference/
│   ├── preprocessing/
│   ├── evaluation/
│   └── tests/
└── storage/
```

This is the intended target structure, not a requirement to create every directory immediately.

Create folders and modules when the implementation needs them. Let the relevant tooling generate lockfiles, migrations, and other generated files.

## 15. Vertical-Slicing Rule

The architecture must be implemented incrementally.

Do not create every planned module with empty placeholder functions before a working slice exists.

For each slice:

1. Identify the required modules and contracts.
2. Implement the minimum necessary structure.
3. Connect the frontend, API, business logic, and persistence.
4. Add tests.
5. Verify the actual workflow.
6. Refactor only when the evidence justifies it.
7. Update this document when significant architecture decisions change.

## 16. Architecture Decision Rules

Significant changes must be documented in `DECISIONS.md`.

Each decision should include:

- Context and requirement.
- Options considered.
- Selected approach.
- Rationale.
- Trade-offs.
- Consequences for security, testing, and maintenance.

Avoid undocumented changes to frameworks, persistence strategy, model architecture, or storage behavior.

## 17. Definition of Done

The architecture is being implemented correctly when each completed slice has clear module responsibilities, working data flow, validated API contracts, reliable persistence where required, appropriate security controls, and passing relevant tests.

The architecture must support a working product without introducing complexity that the MVP does not need.