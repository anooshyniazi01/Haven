# Haven — Repository Structure

## 1. Purpose

This document defines the intended directory structure for Haven.

The repository must remain organized, modular, testable, and easy to maintain. Frontend code, backend code, documentation, tests, configuration, and runtime data must have clear boundaries.

Before creating files, inspect the existing repository. Preserve working files and adapt this structure when necessary rather than overwriting existing work blindly.

## 2. Target Repository Layout

The following is the intended structure. Some directories and files should be created only when the corresponding functionality is implemented.

```text
Haven/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
│
├── docs/
│   ├── PRD.md
│   ├── SCOPE.md
│   ├── ACCEPTANCE_CRITERIA.md
│   ├── USER_FLOWS.md
│   ├── TECH_STACK.md
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── DATABASE_SCHEMA.md
│   ├── DATA_DICTIONARY.md
│   ├── AI_SPEC.md
│   ├── MODEL_EVALUATION.md
│   ├── SECURITY.md
│   ├── PRIVACY.md
│   ├── THREAT_MODEL.md
│   ├── EVIDENCE_HANDLING.md
│   ├── ERROR_HANDLING.md
│   ├── TEST_PLAN.md
│   ├── UI_UX_SPEC.md
│   ├── DESIGN_SYSTEM.md
│   ├── ACCESSIBILITY.md
│   ├── DEPLOYMENT.md
│   ├── DECISIONS.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── REPO_STRUCTURE.md
│
├── skills/
│   ├── SKILLS.md
│   ├── frontend/
│   │   └── SKILL.md
│   ├── backend/
│   │   └── SKILL.md
│   ├── ai-forensics/
│   │   └── SKILL.md
│   └── security/
│       └── SKILL.md
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── app/
│   │   │   ├── router.tsx
│   │   │   └── providers.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── forms/
│   │   │   └── feedback/
│   │   │
│   │   ├── features/
│   │   │   ├── overview/
│   │   │   ├── image-upload/
│   │   │   ├── analysis/
│   │   │   ├── evidence-vault/
│   │   │   ├── incident-tracker/
│   │   │   ├── report-export/
│   │   │   ├── safety-guide/
│   │   │   └── settings/
│   │   │
│   │   ├── services/
│   │   │   ├── api-client.ts
│   │   │   └── health.ts
│   │   │
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── styles/
│   │       ├── tokens.css
│   │       └── global.css
│   │
│   ├── tests/
│   │
│   └── .env.example
│
├── backend/
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── .env.example
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── errors.py
│   │   │   └── logging.py
│   │   │
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── models/
│   │   │
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── storage/
│   │   ├── analysis/
│   │   └── utils/
│   │
│   ├── migrations/
│   │   └── versions/
│   │
│   └── tests/
│       ├── conftest.py
│       ├── unit/
│       ├── integration/
│       └── fixtures/
│
├── scripts/
│
└── .github/
    └── workflows/
```

## 3. Root-Level Files

### `AGENTS.md`

Contains the instructions coding agents must follow while working on Haven.

### `README.md`

Explains the project, prerequisites, setup, development commands, testing, and known limitations.

### `.gitignore`

Excludes virtual environments, dependency caches, local environment files, generated builds, runtime databases, private evidence, temporary files, and other sensitive or machine-specific artifacts.

### `.env.example`

Contains safe configuration examples only. Never include real secrets, private evidence, or actual user credentials.

Do not create duplicate environment templates at multiple levels unless the configuration genuinely requires them. The final structure should have one clear source for each category of configuration.

## 4. Frontend Organization

### `src/app/`

Application-level configuration, routing, and shared providers.

### `src/components/ui/`

Reusable, general-purpose interface components, such as buttons, inputs, dialogs, and status labels.

### `src/components/layout/`

Application shell components, navigation, sidebar, and responsive layout elements.

### `src/components/forms/`

Reusable form-related components that are shared by multiple features.

### `src/components/feedback/`

Reusable loading indicators, alerts, error messages, empty states, and operation-status components.

### `src/features/`

Feature-specific UI, state, hooks, and supporting code.

Each feature should keep closely related implementation details together rather than spreading every feature across unrelated global folders.

For example, `features/image-upload/` may contain:
- Upload page or component.
- Upload-specific validation.
- Upload state management.
- Feature-specific tests.

The feature must still use the shared API client and reusable UI components where appropriate.

### `src/services/`

Frontend communication with the backend and other explicitly approved services.

Use a consistent API client for:
- Base URL configuration.
- Request construction.
- Response parsing.
- Error normalization.
- Cancellation or timeout handling where appropriate.

Do not place secret backend credentials in frontend code.

### `src/types/`

Shared frontend TypeScript types that do not belong exclusively to one feature.

Keep feature-specific types near their feature when doing so improves clarity.

### `src/utils/`

Small, reusable utilities that do not belong to a specific feature or service.

Do not turn this directory into a dumping ground for unrelated application logic.

### `src/styles/`

Global styling and centralized design tokens.

Use `DESIGN_SYSTEM.md` as the source of truth for visual conventions.

## 5. Backend Organization

### `app/main.py`

Creates the FastAPI application, registers routes, and configures application startup and shutdown behavior where required.

Keep business logic out of the main application entry point.

### `app/api/routes/`

Defines HTTP endpoints and connects validated requests to application services.

Route handlers should remain relatively thin. They should not contain large blocks of image-processing or database business logic.

### `app/core/`

Application-wide configuration, error handling, and logging.

Keep sensitive configuration server-side and ensure logging follows the privacy requirements.

### `app/db/`

Database engine, sessions, shared model registration, and database-specific setup.

### `app/db/models/`

SQLAlchemy models representing persisted application entities.

Use `DATABASE_SCHEMA.md` and `DATA_DICTIONARY.md` to guide their design.

### `app/schemas/`

Pydantic request and response schemas.

API schemas must remain consistent with `API_SPEC.md`.

Do not expose internal database fields simply because they exist in a model.

### `app/services/`

Business logic and application workflows.

Examples include upload processing, analysis orchestration, report generation, and incident operations.

### `app/repositories/`

Database-access abstractions when they genuinely improve separation and testability.

Avoid creating unnecessary repository wrappers for every trivial operation.

### `app/storage/`

Private evidence storage operations, safe file access, and related storage behavior.

This module must not expose an unrestricted public directory.

### `app/analysis/`

Technical image inspection, hashing-related analysis orchestration, and model inference components.

Keep model-specific implementation details separate from API route handlers.

### `app/utils/`

Small shared utilities that do not belong to a specific service or domain.

## 6. Backend Layer Responsibilities

Use the following general flow:

```text
HTTP Request
    ↓
API Route
    ↓
Request Validation
    ↓
Application Service
    ↓
Database / Private Storage / Analysis Method
    ↓
Validated Response
```

The exact layering may be simplified when a feature is small. Do not introduce unnecessary abstractions solely to match a diagram.

Requirements:
- Routes handle HTTP concerns.
- Schemas validate external data.
- Services implement business workflows.
- Database models represent persisted records.
- Storage code controls private file operations.
- Analysis code implements real, documented methods.
- Error handling converts failures into controlled API responses.

## 7. Tests Organization

### Backend tests

`backend/tests/unit/` contains isolated tests for services, validation, hashing, and analysis utilities.

`backend/tests/integration/` contains tests involving API endpoints, database persistence, storage interactions, and other integrated behavior.

`backend/tests/fixtures/` contains safe, non-sensitive test assets and reusable test data.

`backend/tests/conftest.py` contains shared pytest fixtures where appropriate.

Use temporary directories and isolated test databases where possible. Tests must not modify real user evidence or production data.

### Frontend tests

Use colocated test files or `frontend/tests/` consistently.

Frontend tests should cover:
- Component behavior.
- Form validation.
- Loading and error states.
- API interaction.
- Accessibility-relevant behavior.
- Feature workflows.

### End-to-end tests

Place Playwright tests in a clearly documented location if the project uses them.

End-to-end tests must exercise the real application integration appropriate to the test environment, rather than relying on fake success responses for critical workflows.

## 8. Migrations and Runtime Data

Keep database migration scripts under the configured migrations directory.

Store runtime data outside the frontend's public assets.

Examples of runtime data include:
- SQLite database files.
- Uploaded evidence.
- Generated reports.
- Temporary processing files.
- Local caches.

Do not commit sensitive runtime files.

Do not store private evidence in `frontend/public/`, `frontend/src/`, or another directory exposed through static hosting.

The exact storage path must come from backend configuration and must be validated during startup.

## 9. Skills and Agent Instructions

The `skills/` directory contains project-specific instructions for focused implementation tasks.

Each skill should define:
- Its area of responsibility.
- Relevant documentation to consult.
- Required implementation practices.
- Testing expectations.
- Security and privacy considerations.
- Common mistakes to avoid.

Skills supplement `AGENTS.md`; they do not override the project's security, privacy, or correctness requirements.

## 10. Naming Conventions

### Frontend

- React components: `PascalCase.tsx`.
- Hooks: `useSomething.ts`.
- Utilities: `kebab-case.ts` or the established repository convention.
- Tests: follow one consistent naming convention, such as `Component.test.tsx`.

### Backend

- Python modules: `snake_case.py`.
- Classes: `PascalCase`.
- Functions and variables: `snake_case`.
- Tests: `test_<behavior>.py`.

### Documentation

Use descriptive uppercase filenames with underscores for the main project specifications, matching the existing documentation names.

Avoid duplicate documents that describe the same system differently.

## 11. Dependency and File Creation Rules

- Add dependencies only when they serve a defined requirement.
- Update the appropriate manifest and lockfile when dependencies change.
- Do not create empty modules simply to fill out this proposed tree.
- Do not introduce placeholder files that imply unimplemented functionality exists.
- Create new directories when the corresponding implementation requires them.
- Preserve a clear distinction between source code, tests, generated files, and documentation.
- Keep modules small enough to understand, but do not split every few lines into a separate file.
- Remove obsolete code only after checking for dependencies and updating tests.

## 12. Repository Hygiene

Before committing changes, check that:
- No `.env` files containing real configuration are staged.
- No virtual environment is staged.
- No private evidence or uploaded user images are staged.
- No local SQLite database is staged.
- No generated build directory is staged unnecessarily.
- No secrets or access tokens appear in source files.
- No temporary debugging files remain.
- Relevant tests have been run.
- Documentation matches the actual changes.

## 13. Final Rule

This structure is a guide for maintainable implementation, not permission to create the entire application skeleton in one pass.

Build the required files incrementally, following `IMPLEMENTATION_PLAN.md`. Keep each feature integrated and tested before proceeding to the next.
