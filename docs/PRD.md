# Haven — Product Requirements Document (PRD)

**Project:** Haven  
**Document version:** 1.0  
**Status:** Initial specification  
**Product type:** AI-assisted digital safety and media forensics application

---

## 1. Product Vision

Haven helps people respond to potential digital blackmail involving suspicious images or videos.

It provides tools to analyze suspicious media, understand the limitations of the analysis, preserve and organize evidence, document incidents, and find practical safety and reporting guidance.

Haven is designed to help users make informed decisions. It is not a law enforcement tool, a legal authority, or a system that can guarantee whether media is genuine or manipulated.

## 2. Problem Statement

A person facing image-based blackmail may not know whether suspicious media has been manipulated, how to preserve evidence, how to document threats, or what steps to take next.

Existing tools may address individual problems without connecting media analysis, evidence organization, incident documentation, and safety guidance into one understandable workflow.

Haven aims to bring these capabilities together in a privacy-conscious application.

## 3. Target Users

### Primary users

- People threatened with image-based blackmail or non-consensual sharing of intimate imagery.
- People who receive suspicious or potentially manipulated images and need help assessing them.
- People who need to organize digital evidence related to an online threat.

### Secondary users

- Digital safety educators and support organizations.
- Researchers studying media authenticity and digital safety.
- Individuals who want to understand suspicious media without making unsupported assumptions.

The initial MVP is designed for individual users rather than large organizations.

## 4. Product Goals

Haven must:

1. Provide a working image-upload and analysis workflow.
2. Use a real, documented analysis method rather than fabricated predictions.
3. Explain findings in understandable language.
4. Let users preserve and retrieve relevant evidence.
5. Let users document incidents and connect evidence to them.
6. Generate a report from actual saved analysis and incident data.
7. Provide practical safety guidance with useful, verified resources.
8. Minimize unnecessary collection and exposure of sensitive information.
9. Work as an integrated application, not a collection of disconnected demo screens.

## 5. Non-Goals

The initial MVP will not attempt to:

- Guarantee the authenticity or falsity of any image.
- Identify the person who created, edited, or distributed media.
- Identify an anonymous blackmailer.
- Recover deleted messages from third-party platforms.
- Automatically contact police, family members, platforms, or other people.
- Provide legal representation or replace emergency services.
- Guarantee that evidence will be admissible in court.
- Automatically monitor social media or search the internet for a user's images.
- Promise complete anonymity, unbreakable security, or tamper-proof storage.
- Provide a fully featured video-forensics pipeline before image analysis is validated.
- Train a large foundation model from scratch.

These limitations may be revisited only through a documented product decision and an appropriate technical and safety assessment.

## 6. Core User Journey

A typical user should be able to:

1. Open Haven and understand its purpose.
2. Start an image analysis or access an existing incident.
3. Upload a supported image.
4. Receive validation feedback if the file cannot be processed.
5. Run the actual analysis pipeline.
6. Review the result, supporting signals, uncertainty, and limitations.
7. Save relevant evidence or associate it with an incident.
8. Create or update an incident record.
9. Generate a report using saved information.
10. Access relevant safety and reporting guidance.

The application must also support empty states for new users who have not uploaded evidence or created incidents.

## 7. Functional Requirements

### FR-01: Application Foundation

The application must provide a working frontend, backend API, database connection, configuration, and error handling.

The frontend must communicate with the actual backend.

A successful health check must reflect the real backend's status rather than a hardcoded frontend message.

### FR-02: Dashboard

The dashboard must provide clear access to the primary workflows:

- Analyze suspicious media.
- Review saved evidence.
- Manage incidents.
- View previous analyses.
- Access safety guidance.

Any counts, summaries, or recent-activity information must come from real persisted data.

When no data exists, the dashboard must display a useful empty state rather than fabricated statistics or sample records presented as real.

### FR-03: Image Upload

Users must be able to select and upload a supported image.

The system must:

- Support explicitly documented image formats.
- Enforce a configurable maximum file size.
- Validate file content on the server.
- Reject unsupported, malformed, or invalid files.
- Generate safe storage identifiers rather than trusting uploaded filenames.
- Store file metadata and a reference to the stored file.
- Display meaningful validation and upload errors.
- Avoid exposing stored files through unintended public URLs.

Successful uploads must be retrievable through authorized application operations.

### FR-04: AI-Assisted Media Analysis

The application must analyze uploaded images using a real inference pipeline.

The selected model or analysis method must be documented and evaluated for the intended task.

The analysis pipeline must:

- Load the actual model or analysis implementation.
- Validate inputs before inference.
- Handle unsupported inputs and inference failures.
- Record the method and model version where available.
- Save the analysis result and relevant metadata.
- Return a structured response that the frontend can display.
- Communicate uncertainty and known limitations.

The application must not use randomly generated scores or hardcoded classifications as actual predictions.

If a reliable detector is unavailable, the system must report that analysis is unavailable rather than pretending to have completed AI inference.

### FR-05: Explainable Analysis Report

For each completed analysis, users must be able to view a report containing, where supported by the selected analysis method:

- Analysis identifier and timestamp.
- File metadata.
- Analysis method and model version.
- Predicted class or output, if the method provides one.
- The model's score or confidence output, accurately labelled.
- Supporting signals or measurements that were actually computed.
- An explanation of what the findings may and may not mean.
- Known limitations and uncertainty.
- A file integrity hash when implemented.

The report must distinguish measured evidence from model predictions and interpretations.

It must not invent explanations, heatmaps, forensic measurements, or other findings that the pipeline did not produce.

### FR-06: Evidence Vault

Users must be able to organize relevant evidence in a central location.

The initial evidence-management workflow must support:

- Listing saved evidence.
- Viewing available evidence metadata.
- Opening or retrieving evidence through an authorized operation.
- Associating evidence with an incident.
- Deleting evidence through an intentional action.
- Persisting evidence records across application restarts.

The interface must clearly distinguish an evidence record from the original file and from an AI analysis of that file.

Deleting an evidence record must not be described as securely erasing every copy unless the implementation verifies that outcome.

### FR-07: Incident Tracker

Users must be able to create and manage incident records.

An incident may include:

- A user-provided title.
- A description.
- A creation date and last-updated timestamp.
- A status.
- A timeline of recorded events.
- Links to relevant evidence and analysis records.
- Optional notes provided by the user.

Users must be able to create, view, update, and retrieve incidents.

The system must validate incident data and preserve relationships between incidents and their associated records.

Incident descriptions and notes must be treated as sensitive data.

### FR-08: Report Export

Users must be able to export a report generated from actual saved data.

The initial export format is PDF.

Depending on the selected report type, the document may include:

- Incident summary.
- Relevant timestamps.
- Evidence metadata.
- File integrity hashes, when available.
- Saved analysis results and their limitations.
- Incident timeline and notes selected for inclusion.
- A clear disclaimer about the limits of automated analysis.

The export must not invent missing information or silently omit errors.

If no relevant data exists, the application must explain why a report cannot be generated.

### FR-09: Safety Guide

Haven must provide practical guidance for responding to potential digital blackmail.

Guidance should address, where relevant:

- Avoiding impulsive responses to threats.
- Preserving messages and relevant contextual evidence.
- Documenting usernames, account identifiers, dates, and URLs when safe.
- Reporting abusive content through the relevant platform.
- Finding appropriate local support or reporting channels.
- Seeking trusted personal or professional support.
- Taking additional care when the person at risk is a minor or faces immediate danger.

External resources must use verified destinations and should be reviewed for relevance.

Guidance must avoid blaming victims or pressuring them into a particular decision.

Haven must not automatically contact any person or authority on the user's behalf.

### FR-10: Privacy and Safe Handling

The application must minimize unnecessary collection, exposure, and retention of sensitive information.

It must:

- Avoid collecting personal details that are not required for a feature.
- Avoid logging sensitive file contents or incident descriptions.
- Keep uploaded files in non-public storage.
- Validate and restrict file access through backend operations.
- Keep secrets out of source control.
- Explain relevant storage and processing behavior to users.
- Document security limitations and deployment requirements.

External processing of sensitive media must not occur without a documented design decision and appropriate user disclosure.

### FR-11: Error Handling and User Feedback

The application must provide meaningful feedback for:

- Invalid or oversized uploads.
- Unsupported file types.
- Failed analysis.
- Missing records.
- Database or storage errors.
- Network failures.
- Report-generation failures.
- Invalid user input.

Errors must not expose stack traces, secrets, internal file paths, or sensitive server information to users.

A failed operation must not display a false success state.

## 8. Non-Functional Requirements

### NFR-01: Reliability

Core workflows must behave consistently and handle expected errors without crashing the application.

### NFR-02: Performance

The application should remain responsive during uploads and analysis.

Long-running operations must provide appropriate progress or status feedback. Performance targets will be established after the selected model and development hardware are evaluated.

### NFR-03: Security

Input validation, safe file handling, restricted evidence access, secret management, and appropriate error handling are required.

Security claims must reflect implemented and tested controls.

### NFR-04: Privacy

Sensitive evidence must not be sent to external services by default. Data handling and retention behavior must be documented.

### NFR-05: Usability

The interface must be understandable to non-technical users under stressful circumstances.

Use clear language, meaningful actions, readable layouts, accessible controls, and calm visual feedback.

### NFR-06: Maintainability

Frontend components, backend routes, business logic, data access, AI inference, and report generation must be organized into understandable modules.

### NFR-07: Testability

Each major feature must have appropriate tests. Critical workflows must be tested across the frontend, API, business logic, and persistence layers.

### NFR-08: Portability

The development setup must be documented so the application can be run locally on a supported development environment.

## 9. MVP Acceptance Criteria

The MVP is not considered complete until the following workflows have been implemented and verified:

- The frontend starts and communicates with the backend.
- The backend health endpoint works.
- The database initializes and persists records.
- The dashboard displays actual data or a genuine empty state.
- A supported image can be uploaded and stored safely.
- Invalid uploads are rejected with useful feedback.
- A real analysis pipeline processes a supported image.
- Analysis results are saved and retrieved correctly.
- The report communicates uncertainty and limitations.
- Evidence can be listed and retrieved through authorized operations.
- Incidents can be created, viewed, updated, and linked to evidence.
- A PDF report can be generated from actual saved records.
- Safety guidance contains useful, verified resources.
- Sensitive data is not unintentionally exposed in logs or public storage.
- Relevant tests pass and the major workflows have been exercised end to end.
- Known limitations are documented.

## 10. Development Strategy

Haven must be developed using vertical slicing.

Each slice must deliver a connected piece of working functionality across the relevant layers.

The implementation order is:

1. Application foundation: frontend, backend, health endpoint, and database.
2. Dashboard with real API integration and accurate empty states.
3. Image upload, validation, storage, and metadata persistence.
4. Actual AI analysis and persisted results.
5. Explainable analysis report.
6. Evidence Vault.
7. Incident Tracker.
8. PDF report export.
9. Safety Guide and verified resources.
10. Integration testing, security review, responsive design, and deployment preparation.

The order may be adjusted when a technical dependency requires it, but the reason must be documented.

Do not build a large mock interface before the underlying workflows are implemented.

## 11. Success Measures

The project's success will be measured by:

- Completion of the defined end-to-end workflows.
- Correct persistence and retrieval of records.
- Successful rejection of invalid inputs.
- Transparent reporting of analysis limitations.
- Passing automated tests and integration checks.
- Safe handling of sensitive files and information.
- Usability for people without technical expertise.
- Clear documentation of model evaluation and known failure modes.

Model performance must be measured using an appropriate evaluation dataset and documented metrics before performance claims are made.

## 12. Open Decisions

The following decisions must be resolved and documented before their respective features are implemented:

- Which pretrained media detector or analysis method will be used.
- What evaluation dataset and metrics are appropriate for the selected method.
- Which image formats and maximum upload size the MVP will support.
- What evidence-retention and deletion behavior the application will implement.
- Whether authentication is necessary for the intended deployment model.
- Which geographic regions and support resources the Safety Guide will cover.
- Which deployment environment will be supported.

Do not silently invent answers to these decisions. Research, evaluate, and document the rationale before implementation.