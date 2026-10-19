# Haven — Threat Model

## 1. Purpose

This document identifies potential threats to Haven, the assets that require protection, the people or systems that could cause harm, and the controls needed to reduce risk.

Haven may process sensitive images, forensic analysis results, incident descriptions, and evidence files related to blackmail or image-based abuse. A security failure could expose private information, destroy evidence, mislead a user, or create additional risks for someone already experiencing abuse.

Security must therefore be considered throughout development rather than added after the application is complete.

## 2. Security Objectives

Haven must aim to protect:

- **Confidentiality:** Sensitive evidence and incident information must not be exposed to unauthorized people.
- **Integrity:** Evidence files, saved reports, incident records, and analysis results must not be silently altered.
- **Availability:** Users should be able to access their saved records and use core features reliably.
- **Authenticity transparency:** Haven must distinguish verified technical facts from model predictions and unverified user-provided information.
- **Privacy:** Collect and retain only the information necessary for the product's documented functionality.
- **User safety:** The application must not create additional risks through careless file handling, misleading conclusions, or unsafe recommendations.
- **Accountability:** Important actions and failures should be traceable without recording sensitive evidence contents in application logs.

These objectives guide design decisions but do not constitute a guarantee that all threats can be eliminated.

## 3. System Assets

| Asset | Potential impact if compromised |
|---|---|
| Uploaded images and media | Exposure, unauthorized copying, or misuse |
| Evidence files and stored copies | Loss, alteration, or unauthorized access |
| SHA-256 hashes and file metadata | Misinterpretation or manipulation of technical records |
| AI analysis results | Misleading conclusions or altered reports |
| Incident records and personal notes | Exposure of sensitive experiences and identifying details |
| Exported PDF reports | Accidental disclosure when downloaded, shared, or stored insecurely |
| Database | Unauthorized reading, modification, or deletion |
| File storage | Path traversal, overwrite, disclosure, or storage exhaustion |
| Application configuration and secrets | Unauthorized access or service compromise |
| Logs and error reports | Accidental disclosure of sensitive information |
| Model files and inference pipeline | Model substitution, manipulation, or misleading output |
| Dependencies and build artifacts | Supply-chain compromise or execution of malicious code |

## 4. Threat Actors

Haven should consider the following possible threat actors:

1. **Malicious visitors:** People attempting to exploit publicly accessible endpoints or upload forms.
2. **Malicious uploaders:** Users submitting crafted files intended to exploit parsers, exhaust resources, or manipulate analysis.
3. **Unauthorized local users:** People with access to the same computer or storage location attempting to view private records.
4. **Malicious insiders:** Developers, administrators, or other people with legitimate access who misuse that access.
5. **External attackers:** Individuals exploiting application vulnerabilities, exposed services, leaked credentials, or insecure configurations.
6. **Abusive individuals:** People attempting to obtain another person's evidence or incident information through coercion, device access, or unauthorized account access.
7. **Compromised dependencies:** Third-party packages, model files, or build tools that introduce malicious code.
8. **Accidental operators:** Developers or users who unintentionally expose files, commit private data, misconfigure deployment, or delete important records.

The threat model must not assume that every user is trustworthy or that a person's own device is always safe.

## 5. Trust Boundaries

Haven contains several boundaries where data moves between components with different levels of trust.

### 5.1 Browser to backend

Everything received from the browser must be treated as untrusted, including filenames, MIME types, metadata, text fields, identifiers, and uploaded bytes.

**Required controls:**
- Validate request structure and field lengths.
- Enforce request and upload size limits.
- Validate file content before processing.
- Reject malformed or unsupported input.
- Never trust a user-supplied file path or storage location.
- Apply authorization checks wherever accounts or multiple users are supported.

### 5.2 Backend to filesystem

The backend handles potentially sensitive and potentially malicious files.

**Required controls:**
- Generate server-controlled storage names.
- Store files outside the publicly served frontend directory.
- Prevent path traversal and unintended overwrites.
- Use restricted filesystem permissions.
- Avoid executing or rendering uploaded files as trusted content.
- Apply safe cleanup and retention procedures.

### 5.3 Backend to AI model

Uploaded files and their derived features enter an analysis pipeline.

**Required controls:**
- Validate and decode files using appropriate libraries.
- Limit image dimensions, memory consumption, processing time, and concurrent workloads.
- Handle decoding and inference failures safely.
- Keep model outputs separate from verified technical measurements.
- Do not allow model-generated text to trigger privileged operations.
- Record the model and method version used for each analysis where practical.

### 5.4 Backend to database

The database contains references to files, reports, incidents, and technical metadata.

**Required controls:**
- Use parameterized database operations through the selected ORM.
- Apply schema constraints and validate inputs.
- Use transactions for related updates.
- Prevent unauthorized record access.
- Back up data only through documented, appropriately protected procedures.

### 5.5 Application to external services

External APIs, hosted AI providers, analytics services, and third-party storage create additional disclosure risks.

**Required controls:**
- Do not send sensitive evidence to external services by default.
- Document any proposed external transfer and its purpose.
- Explain the transfer to users before it occurs.
- Evaluate provider retention, access, and training practices before integration.
- Keep credentials in environment-based secret configuration, never in source code.
- Fail safely if an optional external service is unavailable.

### 5.6 User to exported report

A report may contain sensitive details even when the original evidence remains private.

**Required controls:**
- Generate reports from actual stored records.
- Include only necessary information.
- Avoid embedding original images unless explicitly required and clearly disclosed.
- Use safe temporary-file handling.
- Make the download action clear and intentional.
- Do not automatically share reports or publish them to public URLs.

## 6. Threat Scenarios and Mitigations

### T01 — Unauthorized evidence access

**Scenario:** An attacker guesses a record identifier or accesses an exposed file path to retrieve another user's evidence.

**Impact:** Severe privacy violation and potential further abuse.

**Mitigations:**
- Store evidence outside public web directories.
- Never treat an unpredictable identifier as a substitute for authorization.
- Enforce ownership and access checks on every protected record and file endpoint.
- Disable directory listing and public file serving.
- Test access using a second unauthorized account when multi-user authentication exists.
- If the initial application is single-user and local, document that limitation and avoid exposing it as a secure multi-user service.

**Priority:** Critical.

### T02 — Malicious file upload

**Scenario:** An uploaded file uses a misleading extension, malformed image data, or crafted content intended to exploit a decoder.

**Impact:** Application failure, resource exhaustion, or potential code execution through a vulnerable dependency.

**Mitigations:**
- Use an explicit allowlist of supported formats.
- Check file signatures and decode the content; do not rely only on extensions or browser-provided MIME types.
- Set file-size and image-dimension limits.
- Use maintained decoding libraries and update dependencies.
- Reject malformed, unsupported, or excessively complex files.
- Keep file-processing dependencies updated.
- Consider isolated processing for higher-risk deployments.

**Priority:** Critical.

### T03 — Storage exhaustion and denial of service

**Scenario:** An attacker submits numerous large files or requests repeated expensive analyses.

**Impact:** Slow responses, failed uploads, unavailable storage, or application crashes.

**Mitigations:**
- Enforce upload size, request size, and processing-time limits.
- Limit image dimensions and decoded memory requirements.
- Avoid unnecessary duplicate processing.
- Apply concurrency limits.
- Return controlled errors when capacity is exceeded.
- Add rate limiting and quotas before exposing the application publicly.
- Monitor storage consumption without logging sensitive content.

**Priority:** High.

### T04 — Path traversal or file overwrite

**Scenario:** A malicious filename such as `../../somefile` is used to access or overwrite files outside the intended storage directory.

**Impact:** Evidence loss, data exposure, or unauthorized file modification.

**Mitigations:**
- Generate storage filenames on the server.
- Treat the original filename as display metadata only.
- Resolve and validate storage paths against the intended root directory.
- Use safe file-creation modes and prevent accidental overwrites.
- Do not accept arbitrary filesystem paths from clients.

**Priority:** Critical.

### T05 — Database injection or unauthorized modification

**Scenario:** Malicious input is used to alter database queries or modify records belonging to another user.

**Impact:** Data exposure, corruption, or deletion.

**Mitigations:**
- Use SQLAlchemy's parameterized ORM operations.
- Never construct SQL queries by concatenating untrusted input.
- Validate input and constrain database fields.
- Apply record ownership checks.
- Use database transactions for multi-step changes.
- Test malformed input and cross-record access.

**Priority:** High.

### T06 — Sensitive information exposed through logs

**Scenario:** Exceptions, debugging output, or request logs contain uploaded content, incident notes, full filesystem paths, secrets, or personal information.

**Impact:** Private information becomes accessible through log files or monitoring systems.

**Mitigations:**
- Do not log image bytes, raw incident descriptions, credentials, tokens, or full evidence contents.
- Use generic error messages for users and controlled diagnostic details for developers.
- Redact sensitive fields before logging.
- Restrict log access and define log retention.
- Disable verbose debug output in production.
- Review logging behavior during security testing.

**Priority:** High.

### T07 — Misleading AI analysis

**Scenario:** The model labels an image as manipulated or authentic with unjustified confidence, and the user treats the output as definitive proof.

**Impact:** False accusations, incorrect decisions, distress, or mishandling of an incident.

**Mitigations:**
- Describe outputs as model assessments, not proof.
- Display uncertainty and known limitations.
- Evaluate false positives and false negatives on suitable data.
- Do not present unsupported confidence scores or fabricate explanations.
- Preserve technical measurements separately from model interpretations.
- Display a clear limitation statement in reports.
- Allow analysis to fail honestly when the model or input is unsupported.

**Priority:** Critical for user safety.

### T08 — False interpretation of file hashes

**Scenario:** A user assumes a matching SHA-256 hash proves that an image is genuine, was captured at a particular time, or originated from a particular person.

**Impact:** Incorrect forensic conclusions or unreliable evidence claims.

**Mitigations:**
- Explain that a matching hash indicates matching file bytes under the comparison performed.
- Do not claim that a hash proves authenticity, provenance, ownership, capture time, or an unbroken chain of custody.
- Label the scope of each hash comparison clearly.
- Never describe a newly calculated hash as proof that a file was historically unmodified.

**Priority:** High.

### T09 — Evidence altered without detection

**Scenario:** A file or stored report is replaced or modified after initial capture, while the interface continues to present it as unchanged.

**Impact:** Loss of confidence in the integrity of records.

**Mitigations:**
- Calculate and record SHA-256 hashes for files when they enter the documented evidence workflow.
- Recalculate hashes when integrity verification is requested.
- Compare values and report mismatches clearly.
- Preserve relevant timestamps and action records where supported.
- Record limitations: a hash comparison alone does not establish who changed a file or when.
- Avoid claiming a tamper-proof audit trail unless one is actually implemented and tested.

**Priority:** High.

### T10 — Cross-site scripting through filenames or notes

**Scenario:** A crafted filename, incident note, or model-generated string is displayed as executable HTML or JavaScript.

**Impact:** Unauthorized actions in a user's browser or exposure of accessible application data.

**Mitigations:**
- Render untrusted text as text, not executable HTML.
- Use React's standard escaping behavior.
- Avoid unsafe HTML injection APIs.
- Sanitize content if a documented feature genuinely requires rich HTML.
- Use an appropriate Content Security Policy in production.
- Test filenames and notes containing HTML-like strings and script payloads.

**Priority:** High.

### T11 — Cross-site request forgery or unauthorized state changes

**Scenario:** A malicious site causes a user's browser to perform an unintended action against Haven.

**Impact:** Unauthorized deletion, modification, or export of records.

**Mitigations:**
- Assess CSRF exposure based on the authentication mechanism.
- If cookie-based authentication is used, implement appropriate CSRF protection and cookie settings.
- Validate request origins where appropriate.
- Require explicit confirmation for destructive operations.
- Do not use GET requests for state-changing operations.
- Apply authorization checks on every state-changing endpoint.

**Priority:** High for authenticated deployments.

### T12 — Weak authentication or session handling

**Scenario:** An attacker obtains access through weak credentials, exposed session tokens, or incorrectly configured authentication.

**Impact:** Exposure or modification of all records available to the compromised account.

**Mitigations:**
- Do not invent an authentication system without a documented need.
- Before multi-user or public deployment, implement established authentication and authorization controls.
- Protect sessions and credentials.
- Use secure cookie settings when applicable.
- Avoid storing secrets in frontend code or browser logs.
- Test expired sessions, unauthorized access, and account boundaries.

**Priority:** Critical before public multi-user deployment.

### T13 — Dependency or model supply-chain compromise

**Scenario:** A vulnerable package, malicious update, or untrusted model artifact introduces unsafe behavior.

**Impact:** Data exposure, altered results, or compromise of the application environment.

**Mitigations:**
- Use pinned, reproducible dependency versions and committed lockfiles.
- Prefer reputable package and model sources.
- Record the selected model's source, version, and integrity information where available.
- Review significant dependency changes.
- Scan dependencies with suitable tools when available.
- Never execute unknown downloaded scripts or model-loading code without review.
- Document any unresolved supply-chain risk.

**Priority:** High.

### T14 — Unsafe temporary files or incomplete deletion

**Scenario:** Temporary uploads, generated reports, or deleted evidence remain accessible in temporary directories, backups, or logs.

**Impact:** Continued exposure after a user expects information to be removed.

**Mitigations:**
- Use controlled temporary directories and predictable cleanup procedures.
- Remove temporary artifacts after successful processing where appropriate.
- Handle cleanup failures and report them accurately.
- Document the scope of deletion, including database references and application-managed files.
- Do not promise secure erasure from storage devices, backups, or external systems unless verified.
- Test cleanup behavior after both successful and failed processing.

**Priority:** High.

### T15 — Accidental exposure through Git or demo deployment

**Scenario:** A developer commits real evidence, a local database, environment secrets, or generated reports into a public repository or deployment.

**Impact:** Persistent disclosure of sensitive data or credentials.

**Mitigations:**
- Exclude uploaded evidence, databases containing personal records, local environments, secrets, and generated reports from version control.
- Provide a safe `.gitignore`.
- Use synthetic demonstration data only.
- Review repository contents before publishing.
- Keep environment variables and secret files out of frontend bundles and source control.
- If a secret is exposed, revoke or rotate it rather than merely deleting the visible line.

**Priority:** High.

### T16 — Unsafe guidance or overconfident recommendations

**Scenario:** Haven gives generic advice that unintentionally increases danger, promises legal outcomes, or encourages confrontation with an alleged abuser.

**Impact:** Increased personal risk or harmful decisions.

**Mitigations:**
- Use cautious, practical, nonjudgmental safety guidance.
- Avoid instructing users to confront, threaten, or provoke another person.
- Encourage users to consider their immediate safety and trusted local support.
- Distinguish general information from legal advice.
- Do not promise that following a guide will prevent harm.
- Avoid unsupported claims about law enforcement or guaranteed outcomes.

**Priority:** High.

## 7. Risk Prioritization

Use the following qualitative scale during development:

- **Critical:** Could expose highly sensitive evidence, compromise the application, or materially endanger users.
- **High:** Could significantly affect confidentiality, integrity, reliability, or user safety.
- **Medium:** Has a meaningful but more limited impact or requires additional conditions.
- **Low:** Has limited impact and is unlikely to cause significant harm.

Priorities in this document are initial engineering judgments, not measured probabilities. Reassess them when deployment architecture, authentication, model selection, and actual data flows are finalized.

Critical issues must be resolved or explicitly blocked from release. High-risk issues require a documented mitigation and verification plan before the affected feature is considered complete.

## 8. Threat Modeling During Development

For every feature, ask:

1. What data does this feature receive, create, read, modify, or delete?
2. Which inputs are untrusted?
3. Where does data cross a trust boundary?
4. Could a user access another user's records?
5. Could malicious input exhaust resources or exploit a dependency?
6. Could the feature expose sensitive data through errors, logs, exports, or URLs?
7. Could the feature misrepresent an AI prediction as a verified fact?
8. What happens if a database operation, file write, or model inference fails?
9. How will the threat be tested?
10. What limitations remain after mitigation?

Record significant new risks and update this document whenever architecture or data flows change.

## 9. Required Security Tests

The implementation should include tests for the following cases as applicable:

- Unsupported, malformed, oversized, and misleadingly named uploads are rejected safely.
- Filenames cannot cause path traversal or overwrite unrelated files.
- Uploaded files cannot be fetched through unintended public paths.
- Database input cannot alter query structure.
- Unauthorized users cannot access or modify protected records.
- Sensitive content is absent from ordinary application logs.
- Analysis failures do not generate fabricated results.
- Hash mismatches are detected and explained accurately.
- HTML-like filenames and notes render as text.
- Temporary files are cleaned up according to documented behavior.
- Failed database and file operations do not leave misleading partial records.
- Public deployment cannot start with missing required security configuration.
- Exported reports contain only the intended records and information.
- Rate limits and resource limits behave correctly where implemented.

Tests must run against the actual implementation. Do not mark a threat as mitigated solely because the documentation describes a control.

## 10. Release Gates

Haven must not be presented as ready for public use while any of the following remain true:

- Sensitive evidence is exposed through public file paths.
- Untrusted file input can bypass validation or critical resource limits.
- A critical unauthorized-access vulnerability remains unresolved.
- The application fabricates analysis results or presents unsupported forensic claims.
- Secrets are exposed in the repository or frontend bundle.
- A critical dependency or model risk remains unassessed.
- The deployment's authentication and access-control limitations are hidden from users.

If a control is not implemented, label it as a limitation or deployment blocker. Do not describe a planned security feature as already active.

## 11. Scope and Limitations

This document is an initial threat model for a developing application. It is not a formal penetration-test report, certification, legal assessment, or guarantee of forensic admissibility.

Threats and mitigations must be reviewed against the actual implementation before release. The risk profile of a private local prototype differs from that of a publicly accessible, multi-user service.

**Core principle:** Haven must reduce risk without giving users a false sense of security. Protect the evidence, explain uncertainty, and be honest about what the application can and cannot establish.