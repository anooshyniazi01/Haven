# Haven — Acceptance Criteria

**Document version:** 1.0  
**Status:** Initial testable requirements

## 1. Purpose

This document defines the conditions that must be satisfied before a Haven feature can be considered complete.

A feature is not complete merely because its interface renders or its backend endpoint exists. Its expected behavior must be verified.

All acceptance criteria must be tested against the actual implementation.

## 2. Global Acceptance Rules

Every vertical slice must satisfy these rules:

- The frontend communicates with the actual backend.
- The backend validates incoming data.
- Required data is persisted correctly.
- Errors are handled without false success messages.
- Loading, empty, success, and failure states are implemented where relevant.
- Sensitive information is not unintentionally exposed.
- Automated tests are added for important behavior.
- Relevant tests are run, and their actual results are reported.
- Existing working functionality continues to pass regression checks.
- Known limitations are documented.

A criterion is marked **PASS** only after its behavior has been verified. Otherwise, it remains **NOT VERIFIED**, **FAIL**, or **BLOCKED**.

## 3. AC-01 — Application Foundation

### AC-01.1: Frontend startup

**Given** the documented frontend dependencies are installed,

**When** the frontend development command is run,

**Then** the application starts without unresolved build errors.

### AC-01.2: Backend startup

**Given** the documented backend dependencies and configuration are available,

**When** the backend is started,

**Then** the application initializes successfully or returns a clear, actionable startup error.

### AC-01.3: Health endpoint

**Given** the backend is running,

**When** the health endpoint is requested,

**Then** it returns a documented response indicating backend health.

The response must not claim that the database or other dependencies are healthy unless their health has also been checked.

### AC-01.4: Frontend-to-backend communication

**Given** the frontend and backend are running,

**When** the frontend requests backend health information,

**Then** the interface reflects the actual response.

**And** if the backend is unavailable, the frontend handles the failure without pretending the request succeeded.

### AC-01.5: Database initialization

**Given** the application is configured with a supported database,

**When** the documented initialization process runs,

**Then** the required schema is available and the application can perform its expected database operations.

## 4. AC-02 — Dashboard

### AC-02.1: Initial empty state

**Given** a newly initialized database with no user records,

**When** the dashboard loads,

**Then** it displays a useful empty state without fabricated counts, incidents, evidence, or analysis history.

### AC-02.2: Real summary data

**Given** saved records exist,

**When** the dashboard requests summary information,

**Then** displayed counts and recent activity match the actual backend data.

### AC-02.3: Backend failure

**Given** the dashboard API is unavailable,

**When** the dashboard attempts to load its data,

**Then** it displays an understandable error state and does not display fabricated results.

### AC-02.4: Navigation

**Given** the application contains the relevant feature routes,

**When** a user selects a dashboard action,

**Then** the application opens the intended feature.

## 5. AC-03 — Image Upload

### AC-03.1: Valid upload

**Given** a supported, valid image within the configured size limit,

**When** the user uploads it,

**Then** the backend validates the file, stores it safely, and persists its metadata.

### AC-03.2: Invalid file

**Given** a file that is malformed or does not contain a supported image,

**When** the user uploads it,

**Then** the backend rejects it with an appropriate error.

**And** the file is not registered as a successfully uploaded image.

### AC-03.3: Unsupported format

**Given** an unsupported file format,

**When** the user uploads it,

**Then** the application rejects it and explains which formats are supported.

### AC-03.4: Size limit

**Given** a file that exceeds the configured maximum size,

**When** the user uploads it,

**Then** the backend rejects the file without processing it as a valid upload.

### AC-03.5: Filename safety

**Given** an uploaded file has an unusual or malicious filename,

**When** the backend stores the file,

**Then** the original filename cannot control the storage path.

### AC-03.6: Persistence

**Given** an upload has completed successfully,

**When** the backend restarts,

**Then** the saved metadata and stored file remain available according to the configured persistence design.

### AC-03.7: Upload failure

**Given** storage or network operations fail,

**When** the upload is attempted,

**Then** the interface reports failure and does not display a false success state.

## 6. AC-04 — AI-Assisted Media Analysis

### AC-04.1: Real inference

**Given** a valid uploaded image and an available analysis pipeline,

**When** analysis is requested,

**Then** the actual configured model or analysis implementation processes the image.

A hardcoded label, random score, or fabricated response does not satisfy this criterion.

### AC-04.2: Saved result

**Given** an analysis completes successfully,

**When** the backend returns its result,

**Then** the analysis record and its relationship to the relevant image are persisted.

### AC-04.3: Analysis retrieval

**Given** a saved analysis,

**When** the user opens its report,

**Then** the application retrieves the corresponding saved result rather than generating an unrelated result.

### AC-04.4: Model unavailable

**Given** the configured model cannot be loaded,

**When** analysis is requested,

**Then** the application reports that analysis is unavailable and records an appropriate operational error without inventing a prediction.

### AC-04.5: Invalid input

**Given** an unsupported or unreadable image,

**When** analysis is requested,

**Then** the pipeline rejects the input safely and returns a useful error.

### AC-04.6: Honest interpretation

**Given** an analysis produces a prediction or score,

**When** the result is shown,

**Then** the interface identifies what the output means and explains relevant uncertainty and limitations.

**And** it does not claim that a prediction proves authenticity, manipulation, intent, or the identity of a person responsible.

### AC-04.7: Reproducibility metadata

**Given** the pipeline exposes model or method metadata,

**When** an analysis record is saved,

**Then** the available model identity, version, and relevant settings are recorded.

Unavailable metadata must not be invented.

## 7. AC-05 — Analysis Report

### AC-05.1: Correct record

**Given** a saved analysis,

**When** the corresponding report is opened,

**Then** the report displays information belonging to that analysis.

### AC-05.2: Actual findings

**Given** the analysis pipeline produced specific findings,

**When** the report is generated,

**Then** it displays those findings accurately.

The report must not invent measurements, visualizations, or explanations.

### AC-05.3: Missing record

**Given** an analysis identifier does not exist,

**When** the report is requested,

**Then** the backend returns an appropriate not-found response and the interface explains that the report is unavailable.

### AC-05.4: File integrity hash

**Given** a SHA-256 hash has been implemented and recorded,

**When** the report displays it,

**Then** the value corresponds to the documented hashing procedure for the relevant file.

The report must not imply that a hash proves original authenticity or creation time.

## 8. AC-06 — Evidence Vault

### AC-06.1: List evidence

**Given** saved evidence records exist,

**When** the Evidence Vault loads,

**Then** it displays the corresponding persisted records.

### AC-06.2: Empty vault

**Given** no evidence records exist,

**When** the Evidence Vault loads,

**Then** it displays a useful empty state.

### AC-06.3: Retrieve evidence

**Given** an authorized operation requests an existing evidence file,

**When** access is permitted,

**Then** the correct file is returned through the intended backend operation.

### AC-06.4: Missing evidence

**Given** an evidence record or its file is missing,

**When** retrieval is attempted,

**Then** the application reports the failure without returning an unrelated file.

### AC-06.5: Incident association

**Given** an evidence record and an existing incident,

**When** the user links them,

**Then** the association is saved and remains available after a restart.

### AC-06.6: Deletion

**Given** an existing evidence record,

**When** the user confirms deletion,

**Then** the operation follows the documented deletion policy and the interface reflects the actual outcome.

The application must not claim secure erasure of all copies unless it can verify that behavior.

## 9. AC-07 — Incident Tracker

### AC-07.1: Create incident

**Given** valid incident information,

**When** the user creates an incident,

**Then** the backend validates and persists the record.

### AC-07.2: Reject invalid incident

**Given** required information is missing or invalid,

**When** the user submits the incident,

**Then** the application provides useful validation feedback and does not create an invalid record.

### AC-07.3: View and update

**Given** an existing incident,

**When** the user opens and updates it,

**Then** the application retrieves the correct incident and persists permitted changes.

### AC-07.4: Timeline

**Given** an incident has recorded events,

**When** its timeline is opened,

**Then** the application displays the saved events with their recorded timestamps.

The application must distinguish recorded event dates from the time an event was added when those dates differ.

### AC-07.5: Evidence relationships

**Given** an incident is linked to evidence,

**When** the incident is retrieved,

**Then** its linked evidence corresponds to the saved relationships.

### AC-07.6: Persistence

**Given** an incident has been saved,

**When** the backend restarts,

**Then** the incident and its saved relationships remain available.

### AC-07.7: Incident deletion and evidence safety

**Given** an existing incident with linked evidence records,

**When** the user explicitly confirms deletion of the incident,

**Then** the incident record and its join table associations are removed, but all preserved evidence database rows in the `evidence` table and raw evidence files in disk storage remain completely intact.

## 10. AC-08 — PDF Export

### AC-08.1: Generate report

**Given** valid saved incident or analysis data,

**When** the user requests a PDF export,

**Then** the application generates a valid PDF containing the selected information.

### AC-08.2: Correct data

**Given** saved records contain specific details,

**When** the PDF is generated,

**Then** the included details correspond to those records.

### AC-08.3: Missing information

**Given** optional information is unavailable,

**When** the PDF is generated,

**Then** the report omits it or clearly identifies it as unavailable instead of inventing a value.

### AC-08.4: Export failure

**Given** PDF generation fails,

**When** the user requests an export,

**Then** the interface reports the failure without offering a broken file as a successful download.

### AC-08.5: Sensitive information

**Given** a report contains sensitive incident details,

**When** the user exports it,

**Then** the application makes the report's contents clear and avoids unintentionally exposing it through public storage or logs.

## 11. AC-09 — Safety Guide

### AC-09.1: Accessible guidance

**Given** a user opens the Safety Guide,

**When** the page loads,

**Then** practical guidance is available without requiring the user to upload evidence first.

### AC-09.2: Verified resources

**Given** the guide provides an external resource,

**When** the link is checked,

**Then** it points to the intended resource and its purpose is described accurately.

### AC-09.3: Respectful language

**Given** a user reads the guidance,

**When** advice is presented,

**Then** it avoids victim-blaming, unsupported legal claims, and guarantees of safety.

## 12. AC-10 — Privacy and Security

### AC-10.1: Non-public storage

**Given** a sensitive image has been uploaded,

**When** the frontend or an unrelated public request attempts to access its storage location,

**Then** the file is not exposed through an unintended public path.

### AC-10.2: Safe errors

**Given** an unexpected backend failure occurs,

**When** the error reaches the user interface,

**Then** the response does not expose stack traces, secrets, internal filesystem paths, or sensitive server details.

### AC-10.3: Sensitive logging

**Given** uploads, incidents, or analysis requests are processed,

**When** application logs are generated,

**Then** unnecessary sensitive content is not logged.

### AC-10.4: Secret management

**Given** the application requires credentials or secret configuration,

**When** the project is checked into version control,

**Then** actual secrets are not committed to the repository.

### AC-10.5: Invalid resource identifiers

**Given** a request references a missing or unauthorized resource,

**When** the backend processes it,

**Then** access is denied or an appropriate error is returned without exposing unrelated sensitive records.

Authentication and authorization criteria must be expanded once the deployment model is decided.

## 13. AC-11 — Integration and Regression

Before declaring the MVP complete, verify the following user journey:

1. Start the application.
2. Open the dashboard.
3. Upload a supported image.
4. Run actual media analysis.
5. Open the saved analysis report.
6. Save or associate relevant evidence.
7. Create an incident.
8. Link the evidence to the incident.
9. Retrieve the incident and its associated records.
10. Export a PDF report.
11. Open the Safety Guide.
12. Restart the backend and verify persistence.

Also verify that:

- Invalid uploads are rejected.
- Failed inference does not produce a fabricated result.
- Missing records are handled correctly.
- Database or storage failures do not produce false success messages.
- Relevant automated tests pass.
- Existing working slices continue to function.

## 14. Slice Completion Record

For each vertical slice, maintain a record containing:

- Slice identifier and name.
- Acceptance criteria covered.
- Tests added.
- Tests actually executed.
- Pass, fail, blocked, or not-verified status.
- Known limitations.
- Relevant code and documentation changes.

Do not mark a criterion as passed based solely on code inspection when runtime behavior must be tested.

## 15. Definition of Done

A feature is accepted when all applicable acceptance criteria pass, its end-to-end behavior is verified, relevant regression checks pass, and known limitations are documented.

If any mandatory criterion fails, the slice remains incomplete until the failure is fixed or an explicitly approved scope change is documented.