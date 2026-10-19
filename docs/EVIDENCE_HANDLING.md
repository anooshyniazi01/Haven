# Haven — Evidence Handling Specification

## 1. Purpose

This document defines how Haven must handle uploaded media and related records throughout their lifecycle.

Evidence handling must prioritize privacy, integrity, traceability, and transparency. Haven must distinguish between the original file received, technical measurements calculated by the application, AI-generated assessments, and information supplied by the user.

Haven is an assistance and documentation tool. It must not claim that its evidence-handling workflow establishes legal admissibility, proves authorship, or guarantees an unbroken chain of custody.

## 2. Core Principles

All evidence-handling features must follow these principles:

1. **Preserve the received file:** Do not silently overwrite the original uploaded bytes during analysis.
2. **Minimize exposure:** Keep sensitive files out of public directories, ordinary logs, and unnecessary external services.
3. **Validate before processing:** Treat every uploaded file as untrusted.
4. **Maintain integrity records:** Calculate cryptographic hashes and provide clear comparison results.
5. **Separate facts from interpretations:** Keep file measurements, user statements, and AI predictions distinguishable.
6. **Make actions transparent:** Explain what the application stores, processes, exports, and deletes.
7. **Fail safely:** Report processing or storage failures without inventing successful outcomes.
8. **Avoid unsupported guarantees:** Do not claim tamper-proof storage, secure erasure, or forensic certification unless those capabilities have been implemented and independently verified.

## 3. Evidence Lifecycle

Each evidence item should move through the following lifecycle:

1. Upload initiated.
2. File validated.
3. File stored successfully.
4. Initial SHA-256 hash calculated and recorded.
5. Technical metadata extracted where supported.
6. AI analysis performed when requested and available.
7. Evidence and associated records reviewed or exported by the user.
8. Evidence retained until the user deletes it or the documented retention policy applies.
9. Deletion processed and its outcome reported.

A failed step must not be presented as successful. If a failure occurs after partial storage or database creation, the backend must handle the partial state consistently and clean up temporary artifacts where possible.

The interface should display meaningful states such as `Uploading`, `Validating`, `Stored`, `Analyzing`, `Analysis failed`, and `Deletion failed` where applicable. These states must reflect actual backend results.

## 4. Upload and Validation

### 4.1 Supported formats

The initial implementation should support the image formats explicitly selected and tested for the AI pipeline.

The application must maintain a clear allowlist of supported formats. Additional formats must not be accepted merely because a file has a familiar extension.

### 4.2 Validation requirements

Before a file is processed:

- Enforce a configurable maximum upload size.
- Validate the file signature and attempt decoding with an appropriate image library.
- Check the actual decoded format rather than trusting the extension or client-provided MIME type.
- Reject corrupted, unsupported, or malformed files.
- Limit image dimensions and decoded memory consumption.
- Handle unexpected decoding failures safely.
- Generate a unique server-controlled storage identifier.
- Preserve the original filename only as optional, untrusted display metadata.
- Prevent path traversal and unintended file overwrites.
- Avoid logging file contents or sensitive metadata.

If validation fails, return a clear error and ensure that no usable evidence record is incorrectly marked as successfully stored.

### 4.3 Duplicate uploads

Haven may calculate hashes to identify files with identical bytes.

If duplicate detection is implemented, the application must define whether a duplicate creates a new evidence record or references an existing stored object. It must not silently merge unrelated incident records simply because their files have matching hashes.

The initial implementation may allow duplicate files as separate evidence items. This is preferable to introducing ambiguous storage behavior.

## 5. Original File Preservation

After successful upload, Haven should preserve the received file's bytes as the original stored object.

- Do not overwrite the original with a resized, compressed, converted, cropped, or annotated version.
- Perform analysis on an in-memory representation or a separate derived copy.
- Store derived artifacts separately and label them clearly.
- Record transformations if a future feature produces a modified image.
- Do not imply that an uploaded file is the original source captured by a camera; Haven can only establish that it received that file.

If the application cannot preserve the uploaded file due to a storage failure, it must report the failure and must not create a misleading success state.

## 6. Cryptographic Hashing

### 6.1 Algorithm

Use SHA-256 from Python's standard `hashlib` library.

Calculate the hash from the exact file bytes received by the backend, after successful upload validation and before any transformation.

Store the result as a lowercase hexadecimal string of 64 characters.

### 6.2 Hash record

Each evidence record should associate its initial hash with:

- Evidence identifier.
- Hash algorithm.
- SHA-256 value.
- Time the application calculated the hash.
- Relevant file-storage reference.
- Hash-record creation status.

Use a UTC timestamp for backend records and convert it to the user's preferred display format in the interface.

### 6.3 Integrity verification

When a user requests verification:

1. Read the currently stored file.
2. Recalculate its SHA-256 hash.
3. Compare the new hash with the recorded baseline.
4. Return the actual result and the reference hash used for comparison.
5. Explain the scope and limitations of the result.

Possible outcomes:

- **Match:** The compared bytes produce the same SHA-256 value as the recorded baseline.
- **Mismatch:** The current bytes differ from the bytes represented by the baseline hash, subject to the security assumptions of the hash algorithm.
- **Unavailable:** The file or baseline hash could not be accessed or verified.
- **Error:** Verification failed because of an unexpected processing or storage problem.

A missing file must never be reported as a successful verification.

### 6.4 What a hash does not prove

A matching SHA-256 hash does not, by itself, prove:

- That the image depicts a real event.
- That the image is unedited or authentic.
- Who created, captured, or uploaded the image.
- When the image was originally captured.
- That the file came from a particular device.
- That the file was never modified before its initial hash was calculated.
- That no one accessed or copied the file.
- That a complete chain of custody exists.

The interface and exported reports must communicate these limitations wherever hash verification is presented as evidence-related information.

## 7. Metadata Handling

Haven may extract technical metadata supported by its selected libraries, such as:

- File format.
- Pixel dimensions.
- File size.
- Color mode, when available.
- Selected image metadata fields, when supported.

Metadata extraction must be read-only with respect to the stored original.

Metadata may be missing, inaccurate, altered, or removed. Its presence does not establish authenticity or provenance.

Location coordinates, device identifiers, timestamps, and other potentially sensitive metadata must not be displayed or exported unnecessarily. If these fields are retained, the application must document their purpose and provide appropriate user-facing disclosure.

Metadata extraction errors should not prevent otherwise valid image analysis unless the failed field is required for that specific feature.

## 8. AI Analysis and Derived Artifacts

AI analysis must not modify the stored original.

For every completed analysis, record the available information needed to understand and reproduce the result, such as:

- Evidence identifier.
- Analysis identifier.
- Analysis creation time.
- Model or method name and version.
- Relevant configuration or preprocessing version.
- Actual output returned by the analysis pipeline.
- Any supported uncertainty information.
- Processing status and error details appropriate for display.
- Relevant technical measurements, where available.

Do not invent model names, confidence values, explanations, or results.

If no suitable model is available, Haven may provide implemented technical inspection features and hash verification, but it must not label those features as AI-based manipulation detection.

Model outputs must be described as assessments rather than definitive forensic conclusions. Unsupported file types, failed inference, and low-quality inputs must produce honest limitations or controlled errors.

Derived images, visualizations, or other generated artifacts must be stored separately from the original and must not be confused with the evidence file.

## 9. Storage and Access

Evidence files must be stored outside the publicly served frontend directory.

Storage requirements:

- Use server-controlled filenames and identifiers.
- Restrict filesystem access to the application and authorized operators.
- Store file references in the database rather than exposing absolute filesystem paths.
- Do not create public URLs for private evidence by default.
- Require appropriate authorization before retrieving protected evidence.
- Prevent one user from accessing another user's records in multi-user deployments.
- Keep evidence separate from source code, public assets, and frontend build output.
- Do not include real evidence in sample data, automated tests, or repository commits.
- Document backup behavior and any locations where retained copies may exist.

For a local prototype, operating-system access to the user's computer remains a relevant risk. Haven must not imply that application-level privacy controls protect files from every person or program with access to that computer.

## 10. Evidence Records and Audit Information

Evidence records should reference the stored file and its initial hash.

Where useful, Haven may record application events such as:

- Upload completed.
- Validation failed.
- Hash calculated.
- Integrity verification performed.
- Analysis completed or failed.
- Report exported.
- Evidence deletion requested or completed.

Each event should include the relevant record identifier, event type, timestamp, and outcome where appropriate.

Event records must not include raw image bytes, full incident descriptions, credentials, or unnecessary personal details.

An application event log is not automatically a tamper-proof audit trail. Haven must not claim that these records independently establish who performed an action or guarantee that no event was omitted or modified.

## 11. Incident Association

An evidence item may be associated with an incident record if the user chooses to do so.

The application must:

- Preserve the distinction between the evidence file and the incident narrative.
- Allow a user to correct their own descriptive notes where the product supports editing.
- Avoid treating user-provided statements as independently verified facts.
- Avoid automatically assigning an image to an incident based only on its filename or AI output.
- Apply consistent deletion rules to related records.
- Prevent incident association from changing the underlying file bytes.

If one evidence item can be associated with multiple incidents, deletion behavior must be clearly defined so that removing one association does not unintentionally destroy evidence still referenced elsewhere.

For the initial implementation, a simpler one-incident association is acceptable if it matches the database schema and product requirements.

## 12. Exporting Evidence and Reports

Export functionality must be explicit and user-initiated.

When generating a PDF report:

- Retrieve the actual evidence and analysis records associated with the requested item.
- Identify the file and analysis accurately.
- Include the recorded hash and algorithm when available.
- Distinguish technical measurements from AI assessments and user-provided descriptions.
- Include the analysis timestamp and model or method version when available.
- Include relevant limitations and verification status.
- Avoid unsupported statements about authenticity, provenance, legal admissibility, or chain of custody.
- Exclude unrelated incidents and evidence.
- Avoid embedding original image bytes unless the feature explicitly requires them.
- Use temporary files safely and clean them up according to documented behavior.
- Do not automatically upload or share the generated report.

The report should explain that its contents summarize information recorded by Haven and are not an independent certification of authenticity.

Export success must reflect successful report generation. If the operation fails, do not return a success message or an empty file presented as a completed report.

## 13. Deletion and Retention

Haven must document how users can delete evidence and associated records.

A deletion operation should:

1. Identify the requested evidence and its related records.
2. Check authorization and dependencies.
3. Remove the relevant database references and records according to the documented policy.
4. Remove the associated stored file when no retained reference requires it.
5. Clean up application-managed temporary artifacts.
6. Record an appropriate deletion outcome without retaining unnecessary sensitive content.
7. Inform the user if any part of the operation fails.

Deletion must be designed to avoid inconsistent states. For example, a database record must not indicate that a file is available after the file has been removed.

The application must distinguish between:

- Removing an association.
- Deleting a database record.
- Deleting an application-managed file.
- Removing temporary processing artifacts.
- Removing copies from backups or other storage systems.

These are not necessarily the same operation.

Haven must not promise irreversible or secure erasure from physical storage, backups, external systems, or previously exported copies unless those outcomes are actually supported and verified.

If backup retention is implemented, its deletion implications must be documented. If deletion fails, report the failure rather than claiming that all copies have been removed.

## 14. Failure Handling and Recovery

Evidence-related operations must account for partial failures, including:

- Upload interrupted before completion.
- Validation succeeds but storage fails.
- Storage succeeds but hash calculation fails.
- Hash calculation succeeds but database persistence fails.
- Analysis fails after evidence storage succeeds.
- File retrieval fails during verification.
- PDF generation fails.
- Deletion succeeds for one resource but fails for another.

Required behavior:

- Use explicit processing states.
- Apply database transactions to related database changes.
- Clean up orphaned temporary files when safe.
- Avoid deleting unrelated or still-referenced evidence during recovery.
- Keep errors useful but free of unnecessary sensitive details.
- Provide a clear retry path when safe.
- Never convert an unknown outcome into a success state.

Where filesystem and database operations cannot be made fully atomic, document and test the recovery procedure.

## 15. Implementation Requirements

The implementation should provide:

- A dedicated evidence-handling service rather than duplicating file logic across routes.
- Server-generated storage identifiers.
- File validation and configured size limits.
- SHA-256 calculation and integrity comparison.
- Separate original and derived-file handling.
- Database references for evidence and associated analysis records.
- Private file retrieval with appropriate authorization.
- Explicit report export behavior.
- Documented deletion and cleanup procedures.
- Automated tests for normal operation, invalid input, and partial failures.

The service and API must use the actual filesystem, database, and analysis pipeline configured for the application. Do not simulate stored evidence or fabricate hash and verification results.

## 16. Acceptance Criteria

Evidence handling is ready for integration when:

- [ ] Supported uploads are validated using actual file content.
- [ ] Unsupported and malformed files are rejected safely.
- [ ] Original file bytes remain unchanged by analysis.
- [ ] SHA-256 is calculated from the received file bytes.
- [ ] Hash verification recalculates and compares actual file contents.
- [ ] Missing files and mismatches produce accurate outcomes.
- [ ] Evidence is not publicly accessible through unintended paths.
- [ ] Original files and derived artifacts are clearly distinguished.
- [ ] Metadata and AI outputs are presented with appropriate limitations.
- [ ] Exports contain the intended records and no unrelated sensitive data.
- [ ] Deletion behavior is documented and tested.
- [ ] Partial failures do not leave misleading success states.
- [ ] Sensitive evidence is excluded from ordinary logs and repository commits.
- [ ] Automated tests cover critical security and integrity behavior.

## 17. Final Principle

Haven must preserve what it actually receives, record what it actually measures, explain what its models actually predict, and clearly identify what remains unknown.

**Integrity is not the same as authenticity, and documentation is not the same as a verified chain of custody.**