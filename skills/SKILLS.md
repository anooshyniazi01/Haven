# Haven — Skills Index

## 1. Purpose

This directory defines focused instructions for building Haven safely and consistently. Skills supplement the root `AGENTS.md` and project specifications; they do not replace them.

Before implementing a task, identify the relevant skill and read its instructions. Use more than one skill when a task crosses boundaries, such as adding an image-analysis endpoint that also changes the upload interface and evidence-storage behavior.

## 2. Available Skills

| Skill | File | Responsibility |
|---|---|---|
| Frontend | `skills/frontend/SKILL.md` | React, TypeScript, component design, accessibility, responsive layouts, and frontend tests |
| Backend | `skills/backend/SKILL.md` | FastAPI, validation, API contracts, database operations, error handling, and backend tests |
| AI Forensics | `skills/ai-forensics/SKILL.md` | Image-analysis methods, model integration, evaluation, uncertainty, and honest reporting |
| Security | `skills/security/SKILL.md` | Upload safety, privacy, evidence protection, secure storage, and threat-aware implementation |

Each specialized skill must remain focused on its area. Avoid duplicating the entire project specification in every skill file.

## 3. Instruction Priority

When instructions appear to conflict, follow this order:

1. Applicable system and platform safety requirements.
2. The root `AGENTS.md`.
3. The relevant product and technical specifications in `docs/`.
4. The specialized skill for the current task.
5. The implementation plan and the current task requirements.

If a conflict cannot be resolved confidently, stop and explain the conflict before making a consequential design decision. Do not silently weaken privacy, security, testing, or evidence-handling requirements.

## 4. How to Select Skills

Before beginning a task:

1. Read the root `AGENTS.md`.
2. Read `docs/IMPLEMENTATION_PLAN.md` to identify the current vertical slice.
3. Read the relevant specifications for that slice.
4. Read the applicable specialized skill file or files.
5. Implement only the current slice and its necessary dependencies.
6. Run the relevant checks and fix failures before moving forward.

Examples:

- Updating spacing, typography, navigation, or responsive behavior: Frontend.
- Adding an API route, database query, or validation rule: Backend.
- Integrating an image classifier or interpreting model confidence: AI Forensics and Backend.
- Changing file uploads, evidence storage, access controls, or sensitive logging: Security and the relevant Frontend or Backend skill.
- Building an upload-and-analysis flow: all relevant skills, with the end-to-end vertical-slice workflow enforced by `AGENTS.md`.

## 5. Shared Engineering Rules

All skills must reinforce these rules:

- Build one complete vertical slice at a time. Connect the interface, API, backend logic, persistence, and analysis where applicable.
- Do not build the entire frontend first and postpone backend integration until later.
- Do not use mock responses, fabricated results, fake metrics, or placeholder success states as working product functionality.
- Use realistic empty, loading, success, and error states backed by actual application behavior.
- Keep API contracts consistent with `docs/API_SPEC.md`.
- Follow `docs/DATABASE_SCHEMA.md`, `docs/SECURITY.md`, `docs/PRIVACY.md`, and `docs/EVIDENCE_HANDLING.md`.
- Validate inputs on the server, even when the frontend also validates them.
- Never expose private evidence, secrets, environment variables, or sensitive personal information through public assets, logs, or error messages.
- Treat AI findings as uncertain analytical outputs, not proof that an image is authentic, manipulated, or malicious.
- A matching SHA-256 hash shows that the compared file bytes match the recorded hash; it does not establish the file's origin, authenticity, or creation time.
- Do not claim a feature is implemented or tested unless the relevant code and verification support that claim.
- Do not disable or weaken tests to make an implementation appear successful.
- Prefer small, understandable changes over unnecessary abstractions or dependencies.

## 6. Task Completion Requirements

Before considering a task complete:

1. Confirm that the feature matches its specification.
2. Check that related frontend, API, backend, and database behavior is connected where required.
3. Run the relevant automated tests and development checks.
4. Inspect the actual user-facing behavior, including error and empty states.
5. Check for regressions in related features.
6. Update documentation when contracts, behavior, setup, or architectural decisions change.
7. Report what was implemented, what was tested, the actual results, and any remaining limitations.

If a required test cannot be run, state why. Do not report an unverified check as passing.

## 7. Scope Discipline

Do not introduce new product features merely because they seem useful. Follow the approved scope in `docs/SCOPE.md` and the current implementation phase.

If a requirement is unclear, identify the smallest safe interpretation and ask for clarification when the ambiguity materially affects functionality, privacy, security, or evaluation.

The goal is a working, testable, trustworthy Haven—not a large codebase that only looks complete.