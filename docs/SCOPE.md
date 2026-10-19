# Haven — Project Scope

**Document version:** 1.0  
**Status:** Initial scope definition

## 1. Purpose

This document defines the boundaries of Haven's hackathon MVP.

The goal is to deliver a small, cohesive, technically credible application with working end-to-end functionality rather than a large collection of incomplete features.

Every feature included in the MVP must connect to the real application architecture and satisfy its acceptance criteria.

## 2. Scope Principles

1. Working functionality takes priority over feature quantity.
2. Every included feature must be tested through its actual workflow.
3. Real data and real processing must replace fabricated demo results.
4. Privacy and safe handling of sensitive evidence are core requirements.
5. AI capabilities must be evaluated before their performance is presented as reliable.
6. Advanced features must not delay completion of the essential user journey.
7. Features must be implemented one vertical slice at a time.
8. New requirements must be assessed for feasibility before being added.

## 3. P0 — Required MVP Features

These features define the minimum complete product.

### P0.1 — Application Foundation

- React, TypeScript, and Vite frontend.
- Python and FastAPI backend.
- SQLite database.
- Working frontend-to-backend communication.
- Environment-based configuration.
- Health endpoint.
- Basic logging and error handling.
- A documented local development setup.

**Completion condition:** The frontend, backend, and database work together and can be verified locally.

### P0.2 — Functional Dashboard

- Clear entry points to media analysis, evidence, incidents, and safety guidance.
- Real summary data from the backend.
- Useful empty states for new users.
- Recent activity only when actual records exist.
- Loading, error, and success feedback where applicable.

**Completion condition:** Dashboard content reflects the actual application state.

### P0.3 — Image Upload

- Select and upload supported images.
- Server-side validation of file content and size.
- Safe storage with generated filenames.
- Metadata persistence.
- Clear rejection of unsupported or malformed files.
- Appropriate error handling.

**Completion condition:** Valid images are stored and retrievable through authorized backend operations, while invalid uploads are rejected.

### P0.4 — AI-Assisted Image Analysis

- An actual pretrained model or documented analysis pipeline.
- A reproducible inference process.
- Input validation and inference error handling.
- Persisted analysis results.
- Model and method identification where available.
- Honest uncertainty and limitations.

**Completion condition:** A supported image passes through the real inference pipeline, and the resulting output is saved and retrieved correctly.

If a suitable detector cannot be validated in time, expose the limitation clearly rather than fabricating results or overstating reliability.

### P0.5 — Explainable Analysis Report

- Display the actual analysis output.
- Explain what the output can and cannot establish.
- Show relevant measurements or signals only when they were computed.
- Identify the analysis method and model version where available.
- Include a SHA-256 file hash when implemented.
- Preserve a link between the uploaded file and its analysis record.

**Completion condition:** A user can inspect a saved analysis and understand its findings and limitations.

### P0.6 — Evidence Vault

- List saved evidence.
- View evidence metadata.
- Retrieve stored evidence through authorized operations.
- Link evidence to an incident.
- Delete evidence through an intentional action.
- Persist records across backend restarts.

**Completion condition:** Evidence-management operations work with actual stored files and database records.

### P0.7 — Incident Tracker

- Create an incident.
- View and update an incident.
- Record notes and timeline events.
- Link evidence and analysis records.
- Persist incident information.
- Handle missing or invalid records correctly.

**Completion condition:** A user can create an incident, attach relevant evidence, and retrieve the complete saved record.

### P0.8 — PDF Export

- Generate a real PDF from saved data.
- Include relevant incident details, timestamps, evidence metadata, and analysis results.
- Include limitations and disclaimers where applicable.
- Handle missing information honestly.

**Completion condition:** A valid PDF can be generated and opened from an actual saved incident or analysis.

### P0.9 — Safety Guide

- Explain practical steps for preserving evidence.
- Explain how to document threats.
- Provide guidance for reporting abusive content.
- Include relevant, verified support resources.
- Handle urgent safety situations responsibly.
- Avoid victim-blaming language.

**Completion condition:** The guidance is accessible and its external links lead to the intended resources.

### P0.10 — Integrated Quality and Security Checks

- Automated tests for core backend behavior.
- Frontend checks and type checking.
- Integration tests for critical workflows.
- Invalid-upload tests.
- Persistence checks.
- Basic access-control and unsafe-file-access checks appropriate to the deployment model.
- Responsive layout and accessibility review.
- Documented known limitations.

**Completion condition:** Critical user journeys pass their defined acceptance tests, and remaining issues are explicitly documented.

## 4. P1 — Stretch Features

Consider these only after all P0 features work reliably.

### P1.1 — Video Analysis

Support selected video formats through a documented frame-extraction and analysis pipeline.

Potential capabilities include:

- File validation.
- Frame sampling.
- Per-frame analysis.
- Aggregation of supported findings.
- Clear explanation of the limits of video-level conclusions.

Do not assume that detecting an edited frame proves the entire video is fake.

### P1.2 — Evidence Integrity Enhancements

- Record SHA-256 hashes at evidence ingestion.
- Recalculate hashes to detect changes.
- Display integrity-check results.
- Record relevant integrity-check timestamps.
- Improve auditability of evidence operations.

A hash does not prove original authenticity or establish when the file was created.

### P1.3 — Side-by-Side Media Comparison

Allow users to compare two images and inspect relevant differences.

Any similarity score, difference map, or forensic signal must come from an implemented method and be explained accurately.

### P1.4 — Expanded Analysis Signals

Add additional validated signals where suitable, such as metadata inspection or supported image-consistency measurements.

Do not present metadata absence, unusual compression, or a single visual artifact as proof of manipulation.

### P1.5 — Enhanced Incident Dossier

Generate a more comprehensive, user-configurable incident package containing selected evidence metadata, analysis reports, and timeline information.

### P1.6 — Improved Local Privacy Controls

Depending on the architecture, consider automatic retention settings, explicit deletion workflows, and additional local processing controls.

## 5. P2 — Future Product Possibilities

These are outside the initial MVP and require separate planning.

- User accounts and multi-device synchronization.
- Cloud-hosted encrypted evidence storage.
- Multi-user collaboration with carefully designed permissions.
- A dedicated mobile application.
- Browser extensions or social-platform integrations.
- Automated monitoring for matching images online.
- Additional languages and regional support resources.
- Advanced forensic models trained or fine-tuned on appropriately licensed datasets.
- Independent security review and broader deployment hardening.

These features must not be implemented merely to make the project appear larger.

## 6. Explicitly Out of Scope

Haven will not claim to:

- Prove with certainty that media is fake or genuine.
- Identify an anonymous blackmailer.
- Identify a person in an image.
- Guarantee legal admissibility of evidence.
- Automatically report an incident without the user's explicit action.
- Guarantee that stored evidence can never be accessed by an attacker.
- Guarantee complete anonymity or zero data retention without verified controls.
- Replace professional legal, emergency, or victim-support services.

## 7. MVP Delivery Order

Develop and verify the application in this order:

1. Application foundation.
2. Dashboard with real backend integration.
3. Image upload, validation, and storage.
4. AI inference and result persistence.
5. Saved analysis report.
6. Evidence Vault.
7. Incident Tracker.
8. PDF export.
9. Safety Guide.
10. Integration, security, accessibility, and responsive checks.

Each stage is a vertical slice. The relevant frontend, backend, database, and AI components must be connected and tested before the next stage begins.

A later feature may be brought forward only when required by a dependency.

## 8. Scope Change Rules

Before adding a feature, answer:

- Does it support a defined user need?
- Is it required for the MVP or clearly a stretch feature?
- What existing functionality or schedule will it affect?
- What backend, frontend, data, AI, privacy, and testing changes will it require?
- Can it be completed and verified within the available time?

Document significant changes and their rationale.

Do not silently expand the MVP.

## 9. Definition of MVP Success

Haven succeeds as an MVP when a user can upload a supported image, receive an actual analysis result with clear limitations, preserve relevant evidence, document an incident, generate a report from saved data, and access practical safety guidance.

The entire workflow must work end to end.

A larger feature list is not a substitute for a reliable product.