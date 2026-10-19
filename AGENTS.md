# Haven — Project Instructions for AI Coding Agents

## 1. Project Overview

Haven is an AI-assisted blackmail protection and digital media forensics application.

Its purpose is to help people assess suspicious images, organize digital evidence, document blackmail incidents, understand analysis results, and access practical safety and reporting guidance.

Haven must prioritize user safety, privacy, technical reliability, and honest reporting.

This project must be developed as a real, functional application. A visually complete interface is not sufficient if its underlying functionality does not work.

## 2. Mandatory Development Workflow: Vertical Slicing

**Build Haven one complete functionality at a time. Never build the entire frontend first and the backend afterward.**

Each vertical slice must connect the relevant frontend, backend, API, business logic, database or storage, and AI components where applicable.

For every slice:

1. Read the relevant requirements and acceptance criteria before coding.
2. Inspect the existing codebase and understand the current architecture.
3. Define the functionality, API contract, data requirements, validation rules, security requirements, and tests.
4. Implement the required backend functionality.
5. Implement the corresponding frontend functionality.
6. Connect the frontend to the real backend API.
7. Test the complete user journey from the interface to the backend and back.
8. Fix failures before considering the slice complete.
9. Run relevant regression tests to ensure existing functionality still works.
10. Update relevant documentation and report the results.

Do not begin the next slice until the current slice meets its acceptance criteria.

Do not replace a failing feature with a mock, hardcoded result, fake success message, or temporary workaround that hides the failure.

## 3. Slice Completion Requirements

A slice is complete only when:

- Its user-facing functionality works.
- Its backend logic works.
- Its API integration works.
- Data is persisted when persistence is required.
- Input validation and relevant error handling work.
- Loading, success, empty, and failure states are handled where applicable.
- Relevant automated tests pass.
- The complete feature has been tested through the actual application.
- Existing functionality has not been broken.
- Known limitations are documented honestly.

A page rendering successfully does not prove that its functionality works.

Never claim that tests passed unless they were actually run and passed.

If a test cannot be run because of an environment limitation, state that limitation explicitly.

## 4. Initial Technology Direction

Use the following stack unless the project requirements or a documented technical decision justify a change:

- Frontend: React, TypeScript, and Vite.
- Styling: a consistent, accessible design system using reusable components.
- Backend: Python and FastAPI.
- Database: SQLite for the initial development and MVP phase.
- Database access: SQLAlchemy with managed schema migrations.
- AI inference: Python-based inference using an actual pretrained model or a properly implemented, evaluated detection pipeline.
- Testing: appropriate frontend, backend, integration, and end-to-end tests.
- Version control: Git.

Use compatible, maintained dependencies. Check the existing project files before installing packages or changing versions.

Do not introduce additional infrastructure unless it provides a clear benefit to the MVP.

## 5. Product Requirements and Scope

Haven is intended to support these capabilities:

1. Image upload and validation.
2. AI-assisted analysis of suspicious media.
3. An explainable analysis report.
4. A secure evidence vault.
5. Blackmail incident tracking and evidence linking.
6. Report generation and PDF export.
7. Practical safety and reporting guidance.
8. Privacy-conscious handling of sensitive evidence.

Video analysis and other advanced capabilities must be added only when their requirements, feasibility, and evaluation criteria are established.

Implement these features incrementally according to the approved implementation plan. Do not attempt to build everything in one step.

## 6. AI Accuracy and Honest Reporting

Never use random, fabricated, or hardcoded model predictions as if they were real analysis results.

Do not claim that an image is definitely fake, authentic, AI-generated, or manipulated solely because a detector produces a particular score.

The application must communicate uncertainty, relevant signals, model limitations, and the possibility of false positives and false negatives.

Distinguish between:

- Evidence produced by the analysis pipeline.
- Model predictions or confidence scores.
- Interpretations of those results.
- Conclusions that cannot be established from the available evidence.

Do not present a model confidence score as a guaranteed probability that media is fake.

Record the model identity and version, relevant analysis settings, and other reproducibility information when feasible.

## 7. Privacy and Security Requirements

Treat uploaded images, incident descriptions, names, contact details, and evidence as sensitive information.

- Validate uploaded files on the server.
- Enforce file size and allowed-format limits.
- Do not trust filenames, file extensions, or client-provided MIME types alone.
- Use safe server-generated storage names.
- Prevent path traversal and unsafe file access.
- Keep sensitive files out of public frontend directories.
- Never log uploaded media, passwords, access tokens, or unnecessary personal information.
- Keep secrets in environment variables rather than source code.
- Do not expose internal file paths or sensitive server errors to users.
- Restrict evidence access to authorized operations.
- Use secure defaults and document security limitations.
- Avoid uploading sensitive evidence to external AI services without an explicit, documented design decision and clear user disclosure.

For the initial local MVP, implement appropriate protections for the local development environment and document any security limitations before deployment.

## 8. Evidence Integrity

Where evidence hashing is implemented, use a cryptographic hash such as SHA-256.

Explain accurately what a hash establishes: it can help verify that a file's contents have not changed since the recorded hash was created.

A hash alone does not establish that a file is authentic, unedited before collection, or created at a particular time.

Do not describe the evidence vault as tamper-proof unless that claim is supported by the actual architecture and testing.

## 9. Frontend and UI/UX Standards

Haven must have a distinctive, polished, professional interface.

Avoid generic AI-generated dashboard aesthetics, excessive gradients, unnecessary decorative cards, oversized statistics, and repetitive layouts.

The design must be intentional, consistent, accessible, responsive, and appropriate for a sensitive digital safety product.

- Establish reusable design tokens and components.
- Use clear visual hierarchy and readable typography.
- Provide useful feedback for loading, success, empty, and error states.
- Make destructive actions clear and intentional.
- Use accessible labels, keyboard navigation, and sufficient contrast.
- Do not use placeholder content that appears to be real user data.
- Do not display statistics or analysis findings that are not supported by actual data.
- Keep the interface calm and respectful; never use alarming language to exaggerate analysis results.

Read the project's UI/UX and design-system documentation once those files exist.

## 10. API and Data Integrity

- Define and maintain clear request and response schemas.
- Validate inputs at the backend boundary.
- Use appropriate HTTP methods and status codes.
- Handle missing records, invalid requests, and internal failures correctly.
- Keep frontend types consistent with API contracts.
- Do not silently swallow errors.
- Do not report a database operation as successful before it succeeds.
- Use database transactions where appropriate.
- Avoid duplicated business logic across frontend and backend.
- Never assume data exists without checking the actual database or API response.

Update the API specification whenever an API contract changes.

## 11. Code Quality

- Use clear, descriptive names.
- Keep functions and modules focused.
- Prefer simple, maintainable solutions over unnecessary abstractions.
- Avoid duplicated logic and oversized components.
- Add type annotations to Python code where practical.
- Use TypeScript types instead of relying on untyped data.
- Separate API routes, schemas, business logic, data access, and AI inference appropriately.
- Add comments for non-obvious decisions rather than narrating every line.
- Do not suppress errors simply to make a build pass.
- Do not modify unrelated functionality without a clear reason.
- Do not overwrite existing work without inspecting it first.

## 12. Testing and Verification

Choose tests according to the feature being implemented.

Where relevant, test:

- Successful operations.
- Invalid inputs and unsupported files.
- Missing records.
- API failures and timeouts.
- Database persistence.
- Model-loading and inference failures.
- Unauthorized or unsafe access.
- Edge cases and boundary conditions.
- Responsive behavior and accessibility.
- Regression of existing features.

For each vertical slice, verify the actual end-to-end workflow, not just isolated components.

## 13. Documentation Rules

Before implementing a feature, read the relevant available documentation.

At minimum, consult the project requirements, architecture, API specification, security guidance, and acceptance criteria when those files exist.

Follow the applicable skill files in the `skills/` directory when they exist.

Keep documentation consistent with the implementation. Do not document planned functionality as completed functionality.

Do not create redundant documentation files without a clear purpose.

## 14. Git and Checkpoints

Use Git to preserve working progress.

After a vertical slice has been implemented, tested, and accepted, create a clear checkpoint commit when Git is configured and the user has authorized the workflow.

Do not commit secrets, uploaded evidence, local databases containing sensitive data, virtual environments, dependency caches, or other generated artifacts that should remain local.

Do not rewrite history or discard user changes without explicit authorization.

## 15. Required Reporting After Every Slice

After each slice, provide a concise report containing:

1. Functionality implemented.
2. Important files created or changed.
3. API endpoints and data changes.
4. Tests actually run and their results.
5. End-to-end verification performed.
6. Known limitations or unresolved issues.
7. The next proposed slice.

Clearly distinguish completed work from planned work.

If the slice fails acceptance criteria, fix it before proceeding.

## 16. First Task

Start by inspecting the repository and its existing files.

Do not generate the entire application at once.

Do not start with a large frontend mockup.

First establish the documented requirements and implementation plan. Then implement the smallest useful application foundation and verify that the frontend, backend, health endpoint, and database work together.

Proceed one vertical slice at a time, with verification before moving forward.