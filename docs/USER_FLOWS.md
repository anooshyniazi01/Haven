# Haven — User Flows

**Document version:** 1.0  
**Status:** Initial user-flow specification

## 1. Purpose

This document defines how users navigate Haven and complete its main tasks.

The frontend and backend must support these flows as connected workflows. Do not create screens or actions that have no corresponding behavior.

## 2. Main Navigation

The application should provide clear access to:

- **Overview:** Dashboard and recent activity.
- **Analyze Media:** Upload an image and run an analysis.
- **Evidence Vault:** Review and manage saved evidence.
- **Incidents:** Create and manage incident records.
- **Safety Guide:** Access practical safety guidance and verified resources.

Analysis reports should be accessible from completed analyses and relevant incident records.

Navigation labels may be refined during UI design, but their meanings and destinations must remain clear.

## 3. Flow A — First-Time User

**Goal:** Understand Haven and begin using it without needing existing records.

1. The user opens Haven.
2. The application displays a concise explanation of its purpose.
3. The user sees the main navigation and available actions.
4. The dashboard requests its data from the backend.
5. If no records exist, the dashboard displays an intentional empty state.
6. The user can choose to analyze an image, explore the Safety Guide, or begin documenting an incident.

### Expected behavior

- No fabricated evidence, incidents, analysis results, or statistics are displayed.
- The user is not forced to upload an image before accessing safety guidance.
- Navigation works even when the database contains no user records.
- Backend failures produce a clear error state.

## 4. Flow B — Analyze a Suspicious Image

**Goal:** Upload an image and receive an honest, understandable analysis result.

1. The user selects **Analyze Media**.
2. Haven explains which image formats and file sizes are supported.
3. The user selects an image from their device.
4. The interface shows the selected filename and, where appropriate, a local preview.
5. The user confirms the upload.
6. The frontend sends the file to the backend.
7. The backend validates the file's content, format, and size.
8. If validation fails, the user receives a clear explanation and can choose another file.
9. If validation succeeds, the backend stores the file safely and saves its metadata.
10. The application makes the uploaded image available for analysis.
11. The user starts the analysis.
12. The backend runs the actual configured inference pipeline.
13. The interface displays an appropriate processing state while analysis is running.
14. The backend saves the completed result.
15. The interface displays the saved analysis report.
16. The user can review the findings, their limitations, and available next actions.

### Expected behavior

- The frontend never invents an analysis result.
- The interface distinguishes upload completion from analysis completion.
- If the model is unavailable or inference fails, the user sees a failure state rather than a fabricated prediction.
- The user can access a completed report again without rerunning inference unnecessarily.
- The user can choose to preserve relevant evidence or associate it with an incident.

## 5. Flow C — Review an Analysis Report

**Goal:** Understand what an analysis result actually means.

1. The user opens a completed analysis.
2. Haven retrieves the corresponding saved record from the backend.
3. The report displays the available result, analysis method, model information, and relevant findings.
4. The report explains uncertainty and known limitations.
5. If a file integrity hash is available, the report explains its purpose.
6. The user can return to the evidence record or associated incident.
7. The user can export a report when the required information is available.

### Expected behavior

- The report belongs to the requested analysis.
- Only findings actually produced by the pipeline are shown.
- Model scores are labelled accurately.
- The interface does not claim that the result proves whether an image is authentic.
- Missing records produce a useful error state.

## 6. Flow D — Save and Review Evidence

**Goal:** Keep relevant files and their metadata organized.

1. The user opens an uploaded image or an analysis report.
2. The user chooses the appropriate evidence-management action.
3. Haven displays the information that will be saved or associated.
4. The backend performs the operation and persists the relevant record.
5. The interface confirms success only after the operation succeeds.
6. The user opens the Evidence Vault.
7. Haven retrieves the saved evidence records.
8. The user selects a record to view its metadata and available actions.
9. The user may associate the evidence with an incident.
10. If the user chooses deletion, Haven clearly explains the action and requests confirmation when appropriate.
11. The backend applies the documented deletion behavior.
12. The interface reflects the actual outcome.

### Expected behavior

- Evidence records reference the correct stored files.
- The vault uses actual persisted data.
- Missing files are reported rather than replaced with unrelated content.
- Unauthorized file access is prevented.
- Deletion behavior is consistent with the documented retention policy.

## 7. Flow E — Create and Document an Incident

**Goal:** Create a structured record of a blackmail-related incident.

1. The user selects **Incidents**.
2. The user chooses to create an incident.
3. Haven presents a focused form for the incident title and other supported fields.
4. The user enters the available information.
5. The user submits the form.
6. The backend validates and saves the incident.
7. Haven opens the saved incident record.
8. The user can add notes or timeline events.
9. The user can associate existing evidence and analysis records.
10. The application saves each change.
11. The user can leave the page and return later.
12. Haven retrieves the incident and its saved relationships.

### Expected behavior

- Required fields are validated.
- The application does not require users to provide unnecessary personal information.
- User-provided event dates are distinguished from record-creation timestamps.
- Evidence links reference actual records.
- Saved notes and events persist across backend restarts.
- Invalid updates do not silently overwrite existing information.

## 8. Flow F — Generate a PDF Report

**Goal:** Export a readable report from actual saved information.

1. The user opens a saved incident or analysis report.
2. The user chooses the available PDF export action.
3. Haven identifies the saved information that will be included.
4. The backend retrieves the required records.
5. The backend generates the PDF.
6. The application returns the generated file through the intended download mechanism.
7. The user opens the downloaded PDF.

### Expected behavior

- The PDF contains information belonging to the selected record.
- The document is a valid, readable PDF.
- Missing information is not fabricated.
- Relevant limitations are included.
- Failed exports produce an error message instead of a false download success.

## 9. Flow G — Access Safety Guidance

**Goal:** Help the user find practical next steps without forcing them to use other Haven features.

1. The user opens the Safety Guide from navigation or another relevant page.
2. Haven presents concise, organized guidance.
3. The user chooses a topic relevant to their situation.
4. Haven explains practical steps and their purpose.
5. Where relevant, Haven provides a verified external reporting or support resource.
6. The user can open the external resource independently.

### Expected behavior

- Guidance is available without uploading evidence or creating an account.
- Links lead to their intended destinations.
- The language is calm, respectful, and non-judgmental.
- Haven does not automatically contact anyone.
- The application does not promise that following a particular step guarantees safety.

## 10. Flow H — Recover From Errors

**Goal:** Allow users to understand and recover from common failures.

### Upload failure

1. The user attempts an upload.
2. Validation or storage fails.
3. Haven explains the problem.
4. The user can correct the issue or retry when appropriate.

### Analysis failure

1. The user requests analysis.
2. The model or inference pipeline fails.
3. Haven explains that no completed result is available.
4. The user can retry when appropriate or return to the saved image.

### Network failure

1. The user performs an operation.
2. The backend cannot be reached.
3. Haven reports the connection problem.
4. The interface avoids displaying a false success state.
5. The user can retry when safe.

### Missing record

1. The user opens a record that no longer exists or cannot be accessed.
2. Haven displays a clear unavailable state.
3. The user can return to the relevant list or dashboard.

### Expected behavior

- Errors do not expose sensitive internal information.
- Retry actions do not create unintended duplicate records.
- Previously saved data is not silently discarded.
- The application remains navigable after a failure.

## 11. Cross-Feature Navigation Rules

- A completed analysis must link to its corresponding saved image or evidence record.
- Evidence associated with an incident must be accessible from the incident view.
- An incident must show its saved timeline and associated records.
- PDF exports must use the selected saved records.
- Safety guidance must remain accessible independently of analysis and incident workflows.
- Returning to a list must preserve a sensible navigation path.
- A missing related record must be handled without crashing the entire page.

## 12. Privacy Rules Across All Flows

- Do not display sensitive file contents in application logs.
- Do not expose private storage locations in frontend URLs.
- Do not transmit evidence to external services without a documented decision and appropriate disclosure.
- Do not include sensitive information in URLs unnecessarily.
- Avoid collecting personal details that are not needed for the requested operation.
- Explain consequential deletion or export actions clearly.
- Do not claim that evidence has been securely erased unless the implementation supports that claim.

## 13. Implementation Rules

These flows describe intended behavior, not permission to build the entire interface at once.

Implement them incrementally according to the vertical-slicing workflow in `AGENTS.md`.

For each slice:

1. Implement the smallest complete user journey.
2. Connect the relevant frontend and backend.
3. Verify the database or storage behavior.
4. Test success and failure paths.
5. Confirm that existing flows still work.
6. Update documentation when the implementation changes.

Do not create inactive buttons, placeholder pages presented as finished features, or disconnected frontend demonstrations.

## 14. Definition of Done

A user flow is complete when the user can perform its intended task through the actual application, the backend produces the expected result, required data is correctly persisted, failures are handled, and the relevant acceptance criteria pass.