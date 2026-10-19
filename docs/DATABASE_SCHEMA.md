# Haven — Database Schema

## 1. Purpose

This document defines Haven's initial relational database structure.

The database must support image analysis, saved evidence, incident tracking, and report generation. The schema should remain simple enough for local development while preserving data integrity.

Database: SQLite  
ORM: SQLAlchemy  
Migrations: Alembic

## 2. General Rules

- Use UUID strings as primary keys.
- Store timestamps in UTC.
- Use SQLAlchemy models and Alembic migrations.
- Define foreign keys and appropriate indexes.
- Use database constraints where practical.
- Store file bytes on the filesystem, not directly in database columns, unless a future design decision justifies otherwise.
- Store relative storage identifiers or managed storage keys, not publicly accessible URLs or absolute machine-specific paths.
- Never store passwords, API secrets, or unnecessary personal information.
- Do not add authentication tables until authentication is actually designed and implemented.
- Do not use fake records to make the interface appear populated.

## 3. Entity Relationships

The initial data model contains four main entities:

- `Analysis`: An uploaded image and its analysis lifecycle.
- `Evidence`: A file or analysis artifact explicitly preserved in the Evidence Vault.
- `Incident`: A documented suspicious or blackmail-related event.
- `IncidentEvidence`: A linking table connecting incidents to evidence items.

Relationships:

- One analysis may have zero or more associated evidence records.
- One incident may reference zero or more evidence records.
- One evidence record may be linked to multiple incidents.
- An analysis may exist without being saved to the Evidence Vault.
- Deleting or archiving a record must not silently destroy related evidence.

Use a many-to-many relationship between incidents and evidence through `IncidentEvidence`.

## 4. Analyses Table

Table name: `analyses`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `id` | String | Primary key, UUID | Unique analysis ID |
| `original_filename` | String | Required, length-limited | Display filename supplied by the user |
| `storage_key` | String | Required, unique | Internal identifier for the stored upload |
| `file_size_bytes` | Integer | Required, greater than zero | Original upload size |
| `mime_type_detected` | String | Required | Media type determined by server-side validation |
| `sha256` | String | Required, 64 hexadecimal characters | Hash of the original uploaded bytes |
| `status` | String | Required | `uploaded`, `processing`, `completed`, or `failed` |
| `analysis_method` | String | Nullable until known | Actual method used |
| `model_name` | String | Nullable | Model identifier, when applicable |
| `model_version` | String | Nullable | Model version, when available |
| `result_label` | String | Nullable | Actual supported result label |
| `result_score` | Float | Nullable | Score produced by the analysis method |
| `score_type` | String | Nullable | Meaning and scale of the score |
| `explanation` | Text | Nullable | Explanation grounded in actual analysis output |
| `limitations_json` | Text | Required, default empty JSON array | Structured list of limitations |
| `error_code` | String | Nullable | Safe machine-readable failure code |
| `created_at` | DateTime | Required | Upload record creation time |
| `completed_at` | DateTime | Nullable | Time analysis completed |
| `updated_at` | DateTime | Required | Last record update |

### Analysis rules

- `storage_key` must not expose the original filename or an absolute filesystem path.
- `sha256` must be calculated from the actual uploaded bytes.
- A failed analysis must not contain a fabricated successful result.
- A missing score must be stored as `NULL`, not `0`.
- A score must not be called a probability unless the method and calibration justify that interpretation.
- `limitations_json` must contain valid JSON.
- The original upload must remain distinguishable from any transformed or derived artifact.
- Store enough method and version metadata to explain how a result was produced.

## 5. Evidence Table

Table name: `evidence`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `id` | String | Primary key, UUID | Unique evidence ID |
| `analysis_id` | String | Nullable, foreign key to `analyses.id` | Related analysis, if applicable |
| `original_filename` | String | Required, length-limited | Display filename |
| `storage_key` | String | Required, unique | Managed location identifier |
| `file_size_bytes` | Integer | Required, greater than zero | Preserved file size |
| `mime_type_detected` | String | Required | Detected media type |
| `sha256` | String | Required, 64 hexadecimal characters | Hash of preserved bytes |
| `description` | Text | Nullable | User-provided description |
| `created_at` | DateTime | Required | Time evidence record was created |

### Evidence rules

- Preserve original bytes when saving original evidence.
- Compute the hash from the exact bytes being preserved.
- If a derivative is created, store it as a separate artifact with its own hash and clear relationship to the source.
- Saving an existing analysis to the vault must not accidentally create duplicate records on repeated requests.
- A unique hash constraint is not required initially because identical bytes may legitimately appear in separate evidence records.
- Never expose `storage_key` to the public frontend.
- A hash does not prove who created a file, when it was created, or whether its contents are authentic.

## 6. Incidents Table

Table name: `incidents`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `id` | String | Primary key, UUID | Unique incident ID |
| `title` | String | Required, length-limited | Short incident title |
| `description` | Text | Nullable | User-provided notes |
| `incident_date` | Date | Nullable | Date the incident occurred |
| `status` | String | Required, default `open` | Incident tracking status |
| `created_at` | DateTime | Required | Record creation time |
| `updated_at` | DateTime | Required | Last record update |

Allowed incident statuses:

- `open`
- `documented`
- `resolved`

### Incident rules

- Validate status values in the backend.
- Update `updated_at` when an incident changes.
- Do not infer that an incident is legally proven because it has been documented.
- Keep descriptions user-controlled and treat them as untrusted input.
- Do not automatically close an incident when its associated analysis changes.

## 7. IncidentEvidence Table

Table name: `incident_evidence`

This table connects incidents and evidence records.

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `incident_id` | String | Foreign key to `incidents.id` | Linked incident |
| `evidence_id` | String | Foreign key to `evidence.id` | Linked evidence |
| `linked_at` | DateTime | Required | Time the link was created |

Constraints:

- Use a composite primary key consisting of `incident_id` and `evidence_id`.
- Both foreign keys must reference existing records.
- Add indexes where needed for incident-to-evidence and evidence-to-incident lookups.
- Prevent duplicate links between the same incident and evidence record.
- Use restrictive deletion behavior by default; do not cascade-delete preserved evidence when an incident is deleted.

## 8. File Storage Design

Store uploaded files in a managed application storage directory outside the frontend's public directory.

Use separate logical locations for:

- Original uploads.
- Preserved evidence.
- Derived artifacts, if introduced.

The storage implementation must:

1. Generate unpredictable or otherwise collision-safe storage identifiers.
2. Validate file content before accepting a file.
3. Enforce upload size limits.
4. Prevent path traversal and unsafe filename handling.
5. Avoid overwriting existing evidence.
6. Handle database and filesystem failures without leaving misleading records.
7. Document how orphaned files and incomplete writes are detected and recovered.

Do not claim that deleting a database record securely erases the underlying file.

## 9. Hashing and Evidence Integrity

Use Python's standard `hashlib` library to compute SHA-256.

Calculate hashes from the exact byte sequence stored by the application. When a file is read back, recompute the hash if verification is required.

If the recomputed hash differs from the recorded hash, report an integrity mismatch. Do not silently replace the original hash.

A matching hash supports the conclusion that the compared byte sequences match. It does not establish the file's origin, truthfulness, capture time, or chain of custody.

## 10. Indexes

Create indexes for frequently queried fields:

- `analyses.created_at`
- `analyses.status`
- `evidence.created_at`
- `evidence.analysis_id`
- `incidents.created_at`
- `incidents.status`
- `incident_evidence.evidence_id`

Primary keys and unique constraints should provide their required indexes where supported by the database.

Do not add indexes without a query or integrity requirement.

## 11. Database Migrations

Use Alembic for schema changes.

Requirements:

- Generate an initial migration for the approved schema.
- Apply migrations as part of application setup.
- Test migration creation and application against a fresh SQLite database.
- Never silently discard an existing database during startup.
- Document any schema changes and migration requirements.
- Avoid manually changing a database schema without updating the migration history.

## 12. Dashboard Queries

Dashboard summary values must be calculated from database records.

- `total_analyses`: Count of analysis records.
- `saved_evidence_items`: Count of evidence records.
- `open_incidents`: Count of incidents with status `open`.
- `recent_analyses`: Most recent analysis records, ordered newest first.

An empty database must return zero counts and empty lists.

Do not count failed analyses as completed analyses in any future completed-analysis metric.

## 13. Deletion and Retention

The initial version should avoid permanent evidence deletion unless a deliberate, tested deletion workflow is implemented.

Before adding deletion functionality, define:

- User confirmation requirements.
- Database relationship behavior.
- File cleanup behavior.
- Handling of partially completed deletion.
- What remains in application logs.
- Whether backups contain retained copies.

Do not implement a misleading delete operation that removes only database metadata while leaving the user believing all file copies are gone.

## 14. Testing Requirements

Tests must verify:

- All tables can be created in a fresh database.
- Primary keys and foreign keys work as intended.
- Invalid incident statuses are rejected.
- Analysis status transitions are validated.
- Evidence records reference valid analyses when linked.
- Duplicate incident-evidence links are prevented.
- Dashboard counts reflect actual persisted records.
- Empty database responses are correct.
- File hashes match the preserved bytes.
- Database failures do not produce false success responses.
- Migrations can be applied to a clean database.

Use isolated temporary databases in automated tests. Tests must not modify the developer's real evidence or working database.

## 15. Implementation Order

Implement the schema incrementally with the vertical slices:

1. Database connection and migration foundation.
2. Analysis records and upload metadata.
3. Analysis result persistence.
4. Evidence Vault records.
5. Incident records and evidence relationships.
6. Dashboard queries.
7. Regression tests and migration verification.

Do not create unrelated tables or features simply because they might be useful later. Update this document whenever the implemented schema changes.
